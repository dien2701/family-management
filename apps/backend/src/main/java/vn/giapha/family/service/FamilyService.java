package vn.giapha.family.service;

import java.text.Collator;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.auth.AuthFacade.Account;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.consent.ConsentService;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.security.RateLimiter;
import vn.giapha.common.security.RateLimiter.Policy;
import vn.giapha.config.AppProperties;
import vn.giapha.family.dto.CreateFamilyRequest;
import vn.giapha.family.dto.FamilyAccountResponse;
import vn.giapha.family.dto.FamilyResponse;
import vn.giapha.family.dto.InvitationResponse;
import vn.giapha.family.entity.Family;
import vn.giapha.family.entity.FamilyInvitation;
import vn.giapha.family.mapper.FamilyMapper;
import vn.giapha.family.repository.FamilyRepository;

/**
 * Tạo family, tham gia, rời, loại thành viên, chuyển quyền Manager (IDEA §3, §6.2; DECISIONS #22–24).
 *
 * <p>Vai trò và family của người gọi luôn đọc từ DB chứ không tin claim trong access token (claim có thể cũ tới
 * 15 phút, ví dụ vừa bị loại hoặc vừa mất quyền Manager). Thao tác đổi thành viên/Manager khóa dòng {@code family}
 * trước rồi mới kiểm quyền, để hai thao tác đồng thời của cùng một family chạy tuần tự.
 */
@Service
public class FamilyService {

    private final FamilyRepository families;
    private final InvitationService invitations;
    private final AuthFacade auth;
    private final ConsentService consents;
    private final AuditLogWriter audit;
    private final RateLimiter rateLimiter;
    private final FamilyMapper mapper;
    private final Clock clock;
    private final Policy joinPolicy;

    FamilyService(FamilyRepository families, InvitationService invitations, AuthFacade auth,
            ConsentService consents, AuditLogWriter audit, RateLimiter rateLimiter, FamilyMapper mapper,
            Clock clock, AppProperties props) {
        this.families = families;
        this.invitations = invitations;
        this.auth = auth;
        this.consents = consents;
        this.audit = audit;
        this.rateLimiter = rateLimiter;
        this.mapper = mapper;
        this.clock = clock;
        this.joinPolicy = new Policy("family-join", props.family().joinPerMinutePerUser(), Duration.ofMinutes(1));
    }

    // ---------- Tạo, tham gia, xem ----------

    @Transactional
    public FamilyResponse create(Long userId, CreateFamilyRequest req, String clientIp) {
        Account actor = requireCanJoinAnyFamily(userId);
        Family family = families.save(new Family(req.name().trim(), blankToNull(req.originPlace()),
                blankToNull(req.description()), actor.id(), Instant.now(clock)));
        assignOrFail(actor.id(), family.getId(), CurrentUser.ROLE_MANAGER);
        consents.record(actor.id(), family.getId(), clientIp);
        audit.write(family.getId(), actor.id(), "CREATE", "FAMILY", family.getId(), null,
                Map.of("name", family.getName()));
        return view(family, actor.id(), true);
    }

    /** Vào thẳng family bằng mã mời; chỉ bước liên kết "Tôi là ai" mới cần Manager duyệt (DECISIONS #24). */
    @Transactional
    public FamilyResponse join(Long userId, String rawCode, String clientIp) {
        rateLimiter.acquireOrThrow(joinPolicy, String.valueOf(userId), "RATE_LIMITED",
                "Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây.");
        Account actor = requireCanJoinAnyFamily(userId);
        FamilyInvitation invitation = invitations.requireUsable(rawCode);
        Family family = families.findById(invitation.getFamilyId()).orElseThrow(FamilyService::notFound);
        assignOrFail(actor.id(), family.getId(), "MEMBER");
        consents.record(actor.id(), family.getId(), clientIp);
        audit.write(family.getId(), actor.id(), "JOIN", "FAMILY_ACCOUNT", actor.id(), null,
                Map.of("invitationId", invitation.getId()));
        return view(family, actor.id(), false);
    }

    /** {@code familyId} khác family của người gọi thì trả 404, như thể family đó không tồn tại. */
    @Transactional(readOnly = true)
    public FamilyResponse get(Long userId, Long familyId) {
        Account actor = requireActor(userId);
        if (actor.familyId() == null || (familyId != null && !familyId.equals(actor.familyId()))) {
            throw notFound();
        }
        Family family = families.findById(actor.familyId()).orElseThrow(FamilyService::notFound);
        return view(family, actor.id(), CurrentUser.ROLE_MANAGER.equals(actor.familyRole()));
    }

    // ---------- Mã mời (Manager) ----------

    @Transactional
    public InvitationResponse createInvitation(Long userId) {
        Long familyId = lockAsManager(userId);
        return invitations.create(familyId, userId);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listInvitations(Long userId) {
        Account actor = requireActor(userId);
        requireManagerRole(actor);
        return invitations.list(actor.familyId());
    }

    @Transactional
    public void revokeInvitation(Long userId, Long invitationId) {
        Long familyId = lockAsManager(userId);
        invitations.revoke(familyId, invitationId, userId);
    }

    // ---------- Rời, loại, chuyển quyền ----------

    /** Manager phải chuyển quyền trước; sau khi rời, mọi refresh token bị thu hồi (security.md). */
    @Transactional
    public void leave(Long userId) {
        Long familyId = lockFamilyOf(userId);
        if (auth.isManagerOf(userId, familyId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "MANAGER_MUST_TRANSFER",
                    "Bạn đang là Manager. Hãy chuyển quyền Manager cho người khác trước khi rời dòng họ.");
        }
        if (!auth.clearFamily(userId, familyId)) {
            throw notFound();
        }
        auth.revokeSessions(userId);
        audit.write(familyId, userId, "LEAVE", "FAMILY_ACCOUNT", userId, null, null);
    }

    /** Tài khoản không thuộc family của Manager thì trả 404 (không lộ tài khoản của family khác). */
    @Transactional
    public void removeAccount(Long managerId, Long targetUserId) {
        Long familyId = lockAsManager(managerId);
        if (targetUserId.equals(managerId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "CANNOT_REMOVE_SELF",
                    "Bạn không thể tự loại mình. Hãy chuyển quyền Manager rồi chọn \"Rời dòng họ\".");
        }
        if (!auth.clearFamily(targetUserId, familyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND",
                    "Không tìm thấy tài khoản này trong dòng họ.");
        }
        auth.revokeSessions(targetUserId);
        audit.write(familyId, managerId, "REMOVE", "FAMILY_ACCOUNT", targetUserId, null, null);
    }

    /** Manager hiện tại thành User, người nhận thành Manager; cả hai phải đăng nhập lại để claim khớp. */
    @Transactional
    public void transferManager(Long managerId, Long targetUserId) {
        Long familyId = lockAsManager(managerId);
        if (targetUserId.equals(managerId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "CANNOT_TRANSFER_TO_SELF",
                    "Bạn đang là Manager rồi. Hãy chọn một người khác.");
        }
        if (!auth.isActiveMemberOf(targetUserId, familyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND",
                    "Không tìm thấy tài khoản này trong dòng họ, hoặc tài khoản đang bị khóa.");
        }
        // Hạ Manager cũ trước để mọi lúc trong transaction đều có nhiều nhất một Manager
        if (!auth.changeFamilyRole(managerId, familyId, "MEMBER")
                || !auth.changeFamilyRole(targetUserId, familyId, CurrentUser.ROLE_MANAGER)) {
            throw new IllegalStateException("Chuyển quyền Manager không cập nhật được dòng nào");
        }
        auth.revokeSessions(managerId);
        auth.revokeSessions(targetUserId);
        audit.write(familyId, managerId, "TRANSFER_MANAGER", "FAMILY_ACCOUNT", targetUserId,
                Map.of("managerId", managerId), Map.of("managerId", targetUserId));
    }

    // ---------- Nội bộ ----------

    /** Tài khoản bị khóa thì không thao tác được nữa dù access token còn hạn (tối đa 15 phút). */
    private Account requireActor(Long userId) {
        Account actor = auth.find(userId).orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED,
                "UNAUTHENTICATED", "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
        if (actor.locked()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED",
                    "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        return actor;
    }

    /** Admin không thuộc family nào (DECISIONS #22); người đã có family không tham gia thêm family khác. */
    private Account requireCanJoinAnyFamily(Long userId) {
        Account actor = requireActor(userId);
        if (actor.admin()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "ADMIN_CANNOT_HAVE_FAMILY",
                    "Tài khoản quản trị không thuộc dòng họ nào.");
        }
        if (actor.familyId() != null) {
            throw alreadyInFamily();
        }
        return actor;
    }

    /** UPDATE có điều kiện: nếu hai request song song cùng gán family thì chỉ một cái thành công. */
    private void assignOrFail(Long userId, Long familyId, String role) {
        if (!auth.assignFamily(userId, familyId, role)) {
            throw alreadyInFamily();
        }
    }

    /** Khóa dòng family của người gọi và trả {@code familyId}; 404 nếu người gọi không thuộc family nào. */
    private Long lockFamilyOf(Long userId) {
        Account actor = requireActor(userId);
        if (actor.familyId() == null) {
            throw notFound();
        }
        families.findByIdForUpdate(actor.familyId()).orElseThrow(FamilyService::notFound);
        return actor.familyId();
    }

    /** Khóa family rồi kiểm lại vai trò Manager thẳng từ DB. */
    private Long lockAsManager(Long userId) {
        Long familyId = lockFamilyOf(userId);
        if (!auth.isManagerOf(userId, familyId)) {
            throw forbidden();
        }
        return familyId;
    }

    private static void requireManagerRole(Account actor) {
        if (actor.familyId() == null) {
            throw notFound();
        }
        if (!CurrentUser.ROLE_MANAGER.equals(actor.familyRole())) {
            throw forbidden();
        }
    }

    private FamilyResponse view(Family family, Long viewerId, boolean viewerIsManager) {
        Collator collator = Collator.getInstance(Locale.forLanguageTag("vi"));
        List<FamilyAccountResponse> accounts = auth.findByFamily(family.getId()).stream()
                .sorted(Comparator
                        .comparing((Account a) -> !CurrentUser.ROLE_MANAGER.equals(a.familyRole()))
                        .thenComparing(Account::fullName, collator)
                        .thenComparing(Account::id))
                .map(a -> new FamilyAccountResponse(a.id(), a.fullName(), a.avatarUrl(), a.familyRole(),
                        a.memberId(), viewerIsManager || a.id().equals(viewerId) ? a.email() : null))
                .toList();
        return mapper.toResponse(family, accounts);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static BusinessException notFound() {
        return new BusinessException(HttpStatus.NOT_FOUND, "FAMILY_NOT_FOUND", "Không tìm thấy dòng họ.");
    }

    private static BusinessException forbidden() {
        return new BusinessException(HttpStatus.FORBIDDEN, "MANAGER_ONLY",
                "Chỉ Manager của dòng họ mới thực hiện được thao tác này.");
    }

    private static BusinessException alreadyInFamily() {
        return new BusinessException(HttpStatus.CONFLICT, "ALREADY_IN_FAMILY",
                "Bạn đã thuộc một dòng họ. Hãy rời dòng họ hiện tại trước khi tạo hoặc tham gia dòng họ khác.");
    }
}
