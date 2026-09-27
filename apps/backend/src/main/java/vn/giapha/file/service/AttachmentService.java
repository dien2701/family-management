package vn.giapha.file.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.config.DynamicSettings;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.config.AppProperties;
import vn.giapha.file.dto.AttachmentResponse;
import vn.giapha.file.dto.DownloadUrlResponse;
import vn.giapha.file.dto.FileConfirmRequest;
import vn.giapha.file.dto.FileSignRequest;
import vn.giapha.file.dto.FileSignResponse;
import vn.giapha.file.dto.QuotaResponse;
import vn.giapha.file.entity.Attachment;
import vn.giapha.file.entity.AttachmentKind;
import vn.giapha.file.entity.FileFormat;
import vn.giapha.file.repository.AttachmentRepository;
import vn.giapha.file.storage.FileStorage;
import vn.giapha.member.MemberFacade;

/**
 * Tệp đính kèm (IDEA §6.7; DECISIONS #62, #67, #78). Quyền kiểm lại từ DB ({@link AuthFacade#find}), không tin claim:
 * Admin làm được mọi việc; User đã liên kết chỉ được {@code sign}/{@code confirm} ảnh {@code AVATAR} của hồ sơ mình
 * (kiểm ở cả hai bước). Tải lên đi thẳng từ trình duyệt tới Cloudinary bằng chữ ký do máy chủ cấp; {@code confirm}
 * đọc lại tệp bằng khóa máy chủ rồi mới ghi nhận, tệp không đạt thì bị xóa khỏi kho.
 */
@Service
public class AttachmentService {

    private static final String TARGET_TYPE = "ATTACHMENT";
    private static final String FOLDER = "giapha/";
    private static final String AVATAR_FOLDER = FOLDER + "avatar/";
    private static final String DOCUMENT_FOLDER = FOLDER + "document/";
    private static final long BYTES_PER_MB = 1024L * 1024L;
    private static final int MAX_NAME = 255;
    // public_id được ghép thẳng vào đường dẫn Cloudinary nên chỉ nhận ký tự an toàn
    private static final Pattern SAFE_PUBLIC_ID = Pattern.compile("[A-Za-z0-9/_.-]{1,300}");

    private final AttachmentRepository attachments;
    private final FileStorage storage;
    private final StorageCleaner cleaner;
    private final MemberFacade members;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final AppProperties.File config;
    private final DynamicSettings settings;
    private final Clock clock;

    AttachmentService(AttachmentRepository attachments, FileStorage storage, StorageCleaner cleaner,
            MemberFacade members, AuthFacade auth, AuditLogWriter audit, AppProperties props,
            DynamicSettings settings, Clock clock) {
        this.attachments = attachments;
        this.storage = storage;
        this.cleaner = cleaner;
        this.members = members;
        this.auth = auth;
        this.audit = audit;
        this.config = props.file();
        this.settings = settings;
        this.clock = clock;
    }

    // ---------- Tải lên ----------

    @Transactional(readOnly = true)
    public FileSignResponse sign(Long actorId, FileSignRequest request) {
        requireUploader(actorId, request.kind(), request.memberId());

        List<FieldError> errors = new ArrayList<>();
        FileFormat format = parseFormat(request.kind(), request.mimeType(), "mimeType", errors);
        String fileName = parseFileName(request.fileName(), errors);
        parseTitle(request.title(), errors);
        Long size = request.sizeBytes();
        if (size == null || size < 1) {
            errors.add(new FieldError("sizeBytes", "Tệp không hợp lệ."));
        } else if (size > settings.uploadMaxBytes()) {
            errors.add(new FieldError("sizeBytes", "Tệp tối đa " + settings.uploadMaxMb() + " MB."));
        }
        if (format != null && fileName != null && FileFormat.ofFileName(fileName).filter(format::equals).isEmpty()) {
            errors.add(new FieldError("fileName", "Đuôi tệp không khớp với định dạng."));
        }
        if (!errors.isEmpty()) {
            throw validation(errors);
        }
        requireQuota(size);

        FileStorage.SignedUpload signed = storage.signUpload(newPublicId(request.kind(), request.memberId(), format),
                format);
        return new FileSignResponse(signed.uploadUrl(), signed.fields());
    }

    @Transactional
    public AttachmentResponse confirm(Long actorId, FileConfirmRequest request) {
        requireUploader(actorId, request.kind(), request.memberId());

        List<FieldError> errors = new ArrayList<>();
        String fileName = parseFileName(request.fileName(), errors);
        String title = parseTitle(request.title(), errors);
        FileFormat format = null;
        if (fileName != null) {
            format = FileFormat.ofFileName(fileName).orElse(null);
            if (format == null || (request.kind() == AttachmentKind.AVATAR && !format.isImage())) {
                errors.add(new FieldError("fileName", "Định dạng tệp không được hỗ trợ."));
                format = null;
            }
        }
        String publicId = request.publicId();
        if (publicId == null || !SAFE_PUBLIC_ID.matcher(publicId).matches()
                || !publicId.startsWith(expectedPrefix(request.kind(), request.memberId()))) {
            errors.add(new FieldError("publicId", "Mã tệp không hợp lệ."));
        }
        if (!errors.isEmpty()) {
            throw validation(errors);
        }
        if (attachments.existsByPublicId(publicId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "ATTACHMENT_EXISTS", "Tệp này đã được ghi nhận.");
        }

        FileStorage.StoredFile stored = storage.inspect(publicId, format).orElseThrow(() -> validation(
                List.of(new FieldError("publicId", "Chưa tìm thấy tệp trên kho lưu trữ."))));
        long bytes = stored.bytes();
        // Số liệu do kho trả về mới đáng tin; tệp vi phạm thì gỡ khỏi kho ngay
        if (bytes < 1 || bytes > settings.uploadMaxBytes() || !storedFormatMatches(stored, publicId, format)) {
            storage.delete(publicId, format);
            throw validation(List.of(new FieldError("publicId",
                    "Tệp không hợp lệ hoặc vượt quá " + settings.uploadMaxMb() + " MB.")));
        }
        if (attachments.totalBytes() + bytes > settings.totalQuotaBytes()) {
            storage.delete(publicId, format);
            throw quotaExceeded();
        }

        Instant now = Instant.now(clock);
        Attachment row = new Attachment(request.kind(), request.memberId(), publicId, format, stored.secureUrl(),
                request.kind() == AttachmentKind.DOCUMENT ? title : null, fileName, bytes, actorId, now);
        try {
            attachments.saveAndFlush(row);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(HttpStatus.CONFLICT, "ATTACHMENT_EXISTS", "Tệp này đã được ghi nhận.");
        }

        if (row.getKind() == AttachmentKind.AVATAR) {
            // Ảnh cũ bị thay: xóa dòng ngay, xóa trên Cloudinary sau khi commit
            List<Attachment> old = attachments.findByMemberIdAndKind(row.getMemberId(), AttachmentKind.AVATAR).stream()
                    .filter(a -> !a.getId().equals(row.getId())).toList();
            attachments.deleteAll(old);
            cleaner.deleteAfterCommit(old);
            members.changeAvatar(row.getMemberId(), row.getUrl());
        }
        AttachmentResponse response = AttachmentResponse.of(row);
        audit.write(actorId, "CREATE", TARGET_TYPE, row.getId(), null, response);
        return response;
    }

    // ---------- Đọc ----------

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listForMember(Long memberId) {
        if (!members.exists(memberId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên.");
        }
        return attachments.findByMemberIdAndKindOrderByCreatedAtDescIdDesc(memberId, AttachmentKind.DOCUMENT).stream()
                .map(AttachmentResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listCommon() {
        return attachments.findByMemberIdIsNullAndKindOrderByCreatedAtDescIdDesc(AttachmentKind.DOCUMENT).stream()
                .map(AttachmentResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public DownloadUrlResponse downloadUrl(Long id) {
        Attachment a = find(id);
        if (a.getFormat().isImage()) {
            return new DownloadUrlResponse(a.getUrl());
        }
        return new DownloadUrlResponse(storage.downloadUrl(a.getPublicId(), a.getFormat(), config.downloadTtl()));
    }

    @Transactional(readOnly = true)
    public QuotaResponse quota() {
        return new QuotaResponse((double) attachments.totalBytes() / BYTES_PER_MB,
                (double) settings.totalQuotaBytes() / BYTES_PER_MB);
    }

    // ---------- Xóa ----------

    /** Chỉ Admin. Xóa dòng ngay, xóa trên Cloudinary sau khi commit; xóa ảnh đại diện đang dùng thì gỡ ảnh khỏi hồ sơ. */
    @Transactional
    public void delete(Long actorId, Long id) {
        requireAdmin(actorId);
        Attachment a = find(id);
        AttachmentResponse before = AttachmentResponse.of(a);
        attachments.delete(a);
        if (a.getKind() == AttachmentKind.AVATAR) {
            members.changeAvatar(a.getMemberId(), null);
        }
        cleaner.deleteAfterCommit(List.of(a));
        audit.write(actorId, "DELETE", TARGET_TYPE, id, before, null);
    }

    // ---------- Nội bộ ----------

    private Attachment find(Long id) {
        return attachments.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,
                "ATTACHMENT_NOT_FOUND", "Không tìm thấy tệp đính kèm."));
    }

    private void requireAdmin(Long actorId) {
        if (!auth.find(actorId).map(AuthFacade.Account::admin).orElse(false)) {
            throw forbidden();
        }
    }

    /** Admin, hoặc User đã liên kết với đúng {@code memberId} khi tải AVATAR (DECISIONS #78). Cũng kiểm dữ liệu vào. */
    private void requireUploader(Long actorId, AttachmentKind kind, Long memberId) {
        AuthFacade.Account account = auth.find(actorId).filter(AuthFacade.Account::usable).orElseThrow(
                AttachmentService::forbidden);
        List<FieldError> errors = new ArrayList<>();
        if (kind == null) {
            errors.add(new FieldError("kind", "Vui lòng chọn loại tệp."));
        } else if (kind == AttachmentKind.AVATAR && memberId == null) {
            errors.add(new FieldError("memberId", "Ảnh đại diện cần chọn thành viên."));
        }
        if (!errors.isEmpty()) {
            throw validation(errors);
        }
        boolean allowed = account.admin()
                || (kind == AttachmentKind.AVATAR && account.memberId() != null && account.memberId().equals(memberId));
        if (!allowed) {
            throw forbidden();
        }
        if (memberId != null && !members.exists(memberId)) {
            throw validation(List.of(new FieldError("memberId", "Thành viên không tồn tại.")));
        }
    }

    private void requireQuota(long incomingBytes) {
        if (attachments.totalBytes() + incomingBytes > settings.totalQuotaBytes()) {
            throw quotaExceeded();
        }
    }

    private FileFormat parseFormat(AttachmentKind kind, String mimeType, String field, List<FieldError> errors) {
        FileFormat format = FileFormat.ofMime(mimeType).orElse(null);
        if (format == null) {
            errors.add(new FieldError(field, "Chỉ nhận jpg, png, webp, pdf, docx, xlsx."));
        } else if (kind == AttachmentKind.AVATAR && !format.isImage()) {
            errors.add(new FieldError(field, "Ảnh đại diện chỉ nhận jpg, png, webp."));
            return null;
        }
        return format;
    }

    private static String parseFileName(String raw, List<FieldError> errors) {
        String name = raw == null ? "" : raw.trim();
        if (name.isEmpty()) {
            errors.add(new FieldError("fileName", "Vui lòng nhập tên tệp."));
            return null;
        }
        if (name.length() > MAX_NAME) {
            errors.add(new FieldError("fileName", "Tên tệp tối đa " + MAX_NAME + " ký tự."));
            return null;
        }
        return name;
    }

    private static String parseTitle(String raw, List<FieldError> errors) {
        String title = raw == null ? null : raw.trim();
        if (title == null || title.isEmpty()) {
            return null;
        }
        if (title.length() > MAX_NAME) {
            errors.add(new FieldError("title", "Tiêu đề tối đa " + MAX_NAME + " ký tự."));
        }
        return title;
    }

    private static String expectedPrefix(AttachmentKind kind, Long memberId) {
        if (kind == AttachmentKind.AVATAR) {
            return AVATAR_FOLDER + memberId + "-";
        }
        return DOCUMENT_FOLDER;
    }

    /** Ảnh: {@code giapha/avatar/<memberId>-<uuid>}; tệp raw giữ đuôi để tải về đúng loại. */
    private static String newPublicId(AttachmentKind kind, Long memberId, FileFormat format) {
        String id = UUID.randomUUID().toString().replace("-", "");
        String suffix = format.isImage() ? "" : "." + format.extension();
        return expectedPrefix(kind, memberId) + id + suffix;
    }

    private static boolean storedFormatMatches(FileStorage.StoredFile stored, String publicId, FileFormat expected) {
        if (expected.isImage()) {
            String f = stored.format() == null ? "" : stored.format().toLowerCase();
            return expected.extension().equals(f.equals("jpeg") ? "jpg" : f);
        }
        return publicId.toLowerCase().endsWith("." + expected.extension());
    }

    private static BusinessException validation(List<FieldError> errors) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    }

    private static BusinessException forbidden() {
        return new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
    }

    private static BusinessException quotaExceeded() {
        return new BusinessException(HttpStatus.BAD_REQUEST, "QUOTA_EXCEEDED",
                "Đã hết dung lượng lưu trữ của hệ thống.");
    }
}
