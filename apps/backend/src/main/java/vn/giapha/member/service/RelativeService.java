package vn.giapha.member.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.member.dto.RelativeInput;
import vn.giapha.member.dto.RelativeLabelInput;
import vn.giapha.member.dto.RelativeResponse;
import vn.giapha.member.dto.RelativeSnapshot;
import vn.giapha.member.entity.Member;
import vn.giapha.member.entity.MemberRelative;
import vn.giapha.member.mapper.MemberMapper;
import vn.giapha.member.repository.MemberRelativeRepository;
import vn.giapha.member.repository.MemberRepository;

/**
 * Danh sách người thân trong hồ sơ (IDEA §6.2; DECISIONS #75). Một chiều, mỗi người chỉ một dòng trong danh sách của
 * một hồ sơ, không tự thêm chính mình, nhãn bắt buộc và tối đa 50 ký tự. Mọi tài khoản đã duyệt được xem; chủ hồ sơ
 * (theo {@code user.member_id} đọc từ DB, không tin claim) và Admin được ghi, có hiệu lực ngay và ghi audit log.
 */
@Service
public class RelativeService {

    private static final String TARGET_TYPE = "MEMBER_RELATIVE";
    private static final int MAX_LABEL = 50;

    private final MemberRelativeRepository relatives;
    private final MemberRepository members;
    private final MemberMapper mapper;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final Clock clock;

    RelativeService(MemberRelativeRepository relatives, MemberRepository members, MemberMapper mapper, AuthFacade auth,
            AuditLogWriter audit, Clock clock) {
        this.relatives = relatives;
        this.members = members;
        this.mapper = mapper;
        this.auth = auth;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<RelativeResponse> list(Long memberId) {
        requireMember(memberId);
        List<MemberRelative> rows = relatives.findByMemberIdOrderByCreatedAtAscIdAsc(memberId);
        Map<Long, Member> byId = members.findAllById(rows.stream().map(MemberRelative::getRelativeMemberId).toList())
                .stream().collect(Collectors.toMap(Member::getId, Function.identity()));
        return rows.stream().map(row -> toResponse(row, byId.get(row.getRelativeMemberId()))).toList();
    }

    @Transactional
    public RelativeResponse add(Long actorId, Long memberId, RelativeInput input) {
        requireMember(memberId);
        requireOwnerOrAdmin(actorId, memberId);

        List<FieldError> errors = new ArrayList<>();
        Long relativeId = input.relativeMemberId();
        if (relativeId == null || relativeId < 1) {
            errors.add(new FieldError("relativeMemberId", "Vui lòng chọn một thành viên."));
        } else if (relativeId.equals(memberId)) {
            errors.add(new FieldError("relativeMemberId", "Không thể thêm chính chủ hồ sơ làm người thân."));
        }
        String label = parseLabel(input.label(), errors);
        if (!errors.isEmpty()) {
            throw validation(errors);
        }

        Member relative = requireMember(relativeId);
        if (relatives.existsByMemberIdAndRelativeMemberId(memberId, relativeId)) {
            throw exists();
        }
        MemberRelative row = new MemberRelative(memberId, relativeId, label, actorId, Instant.now(clock));
        try {
            // Flush ngay để UNIQUE(member_id, relative_member_id) bắt được hai yêu cầu cùng thêm một người
            relatives.saveAndFlush(row);
        } catch (DataIntegrityViolationException e) {
            throw exists();
        }
        audit.write(actorId, "CREATE", TARGET_TYPE, row.getId(), null, RelativeSnapshot.of(row));
        return toResponse(row, relative);
    }

    /** Chỉ đổi được nhãn; muốn đổi người thì xóa dòng rồi thêm lại. */
    @Transactional
    public RelativeResponse updateLabel(Long actorId, Long memberId, Long relativeRowId, RelativeLabelInput input) {
        requireMember(memberId);
        requireOwnerOrAdmin(actorId, memberId);
        MemberRelative row = findRow(memberId, relativeRowId);

        List<FieldError> errors = new ArrayList<>();
        String label = parseLabel(input.label(), errors);
        if (!errors.isEmpty()) {
            throw validation(errors);
        }
        RelativeSnapshot before = RelativeSnapshot.of(row);
        row.relabel(label, Instant.now(clock));
        audit.write(actorId, "UPDATE", TARGET_TYPE, row.getId(), before, RelativeSnapshot.of(row));
        return toResponse(row, requireMember(row.getRelativeMemberId()));
    }

    /** Chỉ xóa dòng trong hồ sơ này; thành viên được nhắc tới vẫn giữ nguyên. */
    @Transactional
    public void delete(Long actorId, Long memberId, Long relativeRowId) {
        requireMember(memberId);
        requireOwnerOrAdmin(actorId, memberId);
        MemberRelative row = findRow(memberId, relativeRowId);
        audit.write(actorId, "DELETE", TARGET_TYPE, row.getId(), RelativeSnapshot.of(row), null);
        relatives.delete(row);
    }

    // ---------- Nội bộ ----------

    private Member requireMember(Long id) {
        return members.findById(id).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên."));
    }

    private MemberRelative findRow(Long memberId, Long rowId) {
        return relatives.findByIdAndMemberId(rowId, memberId).orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND, "RELATIVE_NOT_FOUND", "Không tìm thấy dòng người thân này."));
    }

    /** Admin, hoặc User đã liên kết đúng với hồ sơ này theo DB. */
    private void requireOwnerOrAdmin(Long actorId, Long memberId) {
        boolean allowed = auth.find(actorId).filter(AuthFacade.Account::usable)
                .map(a -> a.admin() || memberId.equals(a.memberId())).orElse(false);
        if (!allowed) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Chỉ chủ hồ sơ hoặc Admin mới sửa được danh sách người thân.");
        }
    }

    /** Nhãn: cắt khoảng trắng hai đầu, bắt buộc, tối đa 50 ký tự. */
    private static String parseLabel(String raw, List<FieldError> errors) {
        String label = raw == null ? "" : raw.trim();
        if (label.isEmpty()) {
            errors.add(new FieldError("label", "Vui lòng nhập nhãn, ví dụ \"cha\", \"vợ\", \"chú họ\"."));
            return null;
        }
        if (label.length() > MAX_LABEL) {
            errors.add(new FieldError("label", "Nhãn tối đa " + MAX_LABEL + " ký tự."));
            return null;
        }
        return label;
    }

    private RelativeResponse toResponse(MemberRelative row, Member relative) {
        return new RelativeResponse(row.getId(), mapper.toSummary(relative), row.getLabel(), row.getCreatedAt());
    }

    private static BusinessException validation(List<FieldError> errors) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    }

    private static BusinessException exists() {
        return new BusinessException(HttpStatus.CONFLICT, "RELATIVE_EXISTS",
                "Người này đã có trong danh sách người thân. Muốn đổi nhãn thì sửa dòng cũ.");
    }
}
