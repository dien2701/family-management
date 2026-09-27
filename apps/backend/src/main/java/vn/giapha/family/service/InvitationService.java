package vn.giapha.family.service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;
import vn.giapha.family.dto.InvitationResponse;
import vn.giapha.family.dto.InvitationResponse.Status;
import vn.giapha.family.entity.FamilyInvitation;
import vn.giapha.family.mapper.FamilyMapper;
import vn.giapha.family.repository.FamilyInvitationRepository;

/** Mã mời (DECISIONS #24): 8 ký tự ngẫu nhiên, dùng nhiều lần, hết hạn sau 7 ngày, thu hồi được. */
@Service
class InvitationService {

    /** Bỏ 0/O và 1/I/L vì dễ nhầm khi đọc hoặc gõ tay. */
    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final int MAX_CODE_ATTEMPTS = 5;
    private static final int LIST_LIMIT = 50;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final FamilyInvitationRepository invitations;
    private final FamilyMapper mapper;
    private final AuditLogWriter audit;
    private final AppProperties props;
    private final Clock clock;

    InvitationService(FamilyInvitationRepository invitations, FamilyMapper mapper, AuditLogWriter audit,
            AppProperties props, Clock clock) {
        this.invitations = invitations;
        this.mapper = mapper;
        this.audit = audit;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    InvitationResponse create(Long familyId, Long actorId) {
        Instant now = Instant.now(clock);
        FamilyInvitation invitation = invitations.save(new FamilyInvitation(familyId, newUniqueCode(),
                now.plus(props.family().inviteTtl()), actorId, now));
        // Không ghi mã vào audit log: mã cho phép vào family nên coi như thông tin nhạy cảm
        audit.write(familyId, actorId, "CREATE", "FAMILY_INVITATION", invitation.getId(), null,
                Map.of("expiresAt", invitation.getExpiresAt().toString()));
        return toResponse(invitation, now);
    }

    @Transactional(readOnly = true)
    List<InvitationResponse> list(Long familyId) {
        Instant now = Instant.now(clock);
        return invitations.findByFamilyIdOrderByCreatedAtDescIdDesc(familyId).stream()
                .limit(LIST_LIMIT)
                .map(i -> toResponse(i, now))
                .toList();
    }

    /** Mã của family khác coi như không tồn tại (404). Thu hồi mã đã thu hồi thì bỏ qua, không lỗi. */
    @Transactional
    void revoke(Long familyId, Long invitationId, Long actorId) {
        FamilyInvitation invitation = invitations.findByIdAndFamilyId(invitationId, familyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "INVITE_NOT_FOUND",
                        "Không tìm thấy mã mời."));
        if (!invitation.isRevoked()) {
            invitation.revoke(Instant.now(clock));
            audit.write(familyId, actorId, "REVOKE", "FAMILY_INVITATION", invitation.getId(), null, null);
        }
    }

    /** Tìm mã còn dùng được; báo lỗi riêng cho mã sai, đã thu hồi và hết hạn. */
    @Transactional(readOnly = true)
    FamilyInvitation requireUsable(String rawCode) {
        String code = rawCode.trim().toUpperCase(Locale.ROOT);
        FamilyInvitation invitation = invitations.findByCode(code)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "INVITE_NOT_FOUND",
                        "Mã mời không đúng. Vui lòng kiểm tra lại."));
        if (invitation.isRevoked()) {
            throw new BusinessException(HttpStatus.GONE, "INVITE_REVOKED",
                    "Mã mời này đã bị thu hồi. Vui lòng xin mã mới từ người quản lý dòng họ.");
        }
        if (invitation.isExpired(Instant.now(clock))) {
            throw new BusinessException(HttpStatus.GONE, "INVITE_EXPIRED",
                    "Mã mời này đã hết hạn. Vui lòng xin mã mới từ người quản lý dòng họ.");
        }
        return invitation;
    }

    private InvitationResponse toResponse(FamilyInvitation invitation, Instant now) {
        Status status = invitation.isRevoked() ? Status.REVOKED
                : invitation.isExpired(now) ? Status.EXPIRED : Status.ACTIVE;
        return mapper.toResponse(invitation, link(invitation.getCode()), status);
    }

    private String link(String code) {
        String base = props.family().frontendBaseUrl();
        return (base.endsWith("/") ? base.substring(0, base.length() - 1) : base) + "/moi/" + code;
    }

    private String newUniqueCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!invitations.existsByCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Không sinh được mã mời duy nhất sau " + MAX_CODE_ATTEMPTS + " lần thử");
    }
}
