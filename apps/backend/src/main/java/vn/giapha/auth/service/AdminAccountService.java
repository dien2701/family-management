package vn.giapha.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import jakarta.persistence.criteria.Predicate;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AccountApprovedEvent;
import vn.giapha.auth.MemberDirectory;
import vn.giapha.auth.dto.AccountAdminResponse;
import vn.giapha.auth.dto.AccountFilter;
import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.LockReason;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.mapper.UserAccountMapper;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.web.LinkedMember;
import vn.giapha.common.web.PageResponse;

/**
 * Quản lý tài khoản của Admin (IDEA §3, §6.10; DECISIONS #55–56).
 *
 * <p>Vai trò của người gọi luôn đọc từ DB, không tin claim (claim có thể cũ 15 phút, vừa bị gỡ quyền vẫn còn token).
 * Mọi thao tác ghi khóa toàn bộ dòng Admin theo thứ tự id rồi mới khóa người bị tác động, nên hai Admin cùng khóa hoặc
 * gỡ quyền nhau chạy tuần tự và không bao giờ để hệ thống hết Admin.
 */
@Service
public class AdminAccountService {

    private static final String TARGET_TYPE = "ACCOUNT";

    private final UserAccountRepository users;
    private final RefreshTokenService refreshTokens;
    private final AuditLogWriter audit;
    private final UserAccountMapper mapper;
    private final AccountLinking linking;
    private final MemberDirectory members;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    AdminAccountService(UserAccountRepository users, RefreshTokenService refreshTokens, AuditLogWriter audit,
            UserAccountMapper mapper, AccountLinking linking, MemberDirectory members,
            ApplicationEventPublisher events, Clock clock) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.audit = audit;
        this.mapper = mapper;
        this.linking = linking;
        this.members = members;
        this.events = events;
        this.clock = clock;
    }

    /** Một thao tác thay đổi tài khoản; ném {@link BusinessException} để hủy và rollback. */
    @FunctionalInterface
    private interface Change {
        void apply(UserAccount actor, UserAccount target, List<UserAccount> admins);
    }

    // ---------- Danh sách ----------

    /** Tài khoản chưa xác thực OTP (PENDING) chưa phải tài khoản thật nên không hiện ở đây. */
    @Transactional(readOnly = true)
    public PageResponse<AccountAdminResponse> list(Long actorId, AccountFilter filter, int page, int size) {
        requireAdmin(users.findById(actorId).orElse(null));
        Page<UserAccount> result = users.findAll(specOf(filter),
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
        PageResponse<AccountAdminResponse> page = PageResponse.of(result, mapper::toAdminView);
        Map<Long, String> names = members.fullNames(
                page.items().stream().map(AccountAdminResponse::memberId).filter(Objects::nonNull).toList());
        return new PageResponse<>(page.items().stream().map(item -> withMember(item, names)).toList(), page.page(),
                page.size(), page.totalElements(), page.totalPages());
    }

    // ---------- Duyệt ----------

    /** Duyệt lần đầu hoặc duyệt lại tài khoản đã bị từ chối. */
    @Transactional
    public AccountAdminResponse approve(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "APPROVE", (actor, target, admins) -> {
            requireApproval(target, ApprovalStatus.WAITING, ApprovalStatus.REJECTED);
            target.approve(actor.getId(), Instant.now(clock));
            events.publishEvent(new AccountApprovedEvent(target.getId()));
        });
    }

    /** Từ chối tài khoản đang chờ duyệt, hoặc rút lại quyền dùng của tài khoản đã duyệt. */
    @Transactional
    public AccountAdminResponse reject(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "REJECT", (actor, target, admins) -> {
            forbidSelf(actor, target);
            requireApproval(target, ApprovalStatus.WAITING, ApprovalStatus.APPROVED);
            assertNotLastAdmin(target, admins);
            target.reject();
            refreshTokens.revokeAll(target.getId());
        });
    }

    // ---------- Khóa ----------

    @Transactional
    public AccountAdminResponse lock(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "LOCK", (actor, target, admins) -> {
            forbidSelf(actor, target);
            requireStatus(target, AccountStatus.ACTIVE);
            assertNotLastAdmin(target, admins);
            target.setStatus(AccountStatus.LOCKED);
            target.setLockReason(LockReason.MANUAL);
            refreshTokens.revokeAll(target.getId());
        });
    }

    @Transactional
    public AccountAdminResponse unlock(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "UNLOCK", (actor, target, admins) -> {
            requireStatus(target, AccountStatus.LOCKED);
            target.setStatus(AccountStatus.ACTIVE);
            target.setLockReason(null);
        });
    }

    // ---------- Quyền Admin ----------

    /** Chỉ cấp cho tài khoản đã được duyệt và đang hoạt động: Admin luôn là tài khoản dùng được. */
    @Transactional
    public AccountAdminResponse grantAdmin(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "GRANT_ADMIN", (actor, target, admins) -> {
            if (!target.isActiveAndApproved() || target.getSystemRole() != SystemRole.USER) {
                throw invalidState();
            }
            target.setSystemRole(SystemRole.ADMIN);
            // Token cũ còn claim USER: buộc đăng nhập lại để claim khớp (security.md)
            refreshTokens.revokeAll(target.getId());
        });
    }

    @Transactional
    public AccountAdminResponse revokeAdmin(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "REVOKE_ADMIN", (actor, target, admins) -> {
            forbidSelf(actor, target);
            if (target.getSystemRole() != SystemRole.ADMIN) {
                throw invalidState();
            }
            assertNotLastAdmin(target, admins);
            target.setSystemRole(SystemRole.USER);
            refreshTokens.revokeAll(target.getId());
        });
    }

    // ---------- Liên kết "Tôi là ai" (DECISIONS #80, #81) ----------

    /**
     * Gán thành viên cho tài khoản, không cần yêu cầu. Yêu cầu "Đây là tôi" đang chờ của tài khoản đó chuyển sang hủy,
     * email tài khoản được chép sang hồ sơ nếu hồ sơ chưa có, và event được phát để gửi thông báo (phần này của module
     * member, gọi qua {@link MemberDirectory#afterAdminLink}).
     */
    @Transactional
    public AccountAdminResponse linkMember(Long actorId, Long targetId, Long memberId) {
        return mutate(actorId, targetId, "LINK_MEMBER", (actor, target, admins) -> {
            if (!members.fullNames(List.of(memberId)).containsKey(memberId)) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên.");
            }
            linking.link(target, memberId);
            members.afterAdminLink(target.getId(), target.getEmail(), memberId, actor.getId());
        });
    }

    /** Hủy được liên kết của bất kỳ tài khoản nào. Email đã chép sang hồ sơ giữ nguyên. */
    @Transactional
    public AccountAdminResponse unlinkMember(Long actorId, Long targetId) {
        return mutate(actorId, targetId, "UNLINK_MEMBER", (actor, target, admins) -> linking.unlink(target));
    }

    // ---------- Nội bộ ----------

    private AccountAdminResponse mutate(Long actorId, Long targetId, String action, Change change) {
        // Luôn khóa Admin trước rồi mới khóa người bị tác động: thứ tự cố định nên không có deadlock
        List<UserAccount> admins = users.lockAllAdmins();
        UserAccount actor = requireAdmin(
                admins.stream().filter(a -> a.getId().equals(actorId)).findFirst().orElse(null));
        UserAccount target = users.findByIdForUpdate(targetId)
                .filter(u -> u.getStatus() != AccountStatus.PENDING)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND",
                        "Không tìm thấy tài khoản này."));
        Map<String, Object> before = snapshot(target);
        change.apply(actor, target, admins);
        audit.write(actor.getId(), action, TARGET_TYPE, target.getId(), before, snapshot(target));
        return view(target);
    }

    private AccountAdminResponse view(UserAccount user) {
        AccountAdminResponse response = mapper.toAdminView(user);
        if (user.getMemberId() == null) {
            return response;
        }
        return withMember(response, members.fullNames(List.of(user.getMemberId())));
    }

    /** Thành viên bị xóa giữa chừng (không còn tên) thì coi như không có thành viên để hiện. */
    private static AccountAdminResponse withMember(AccountAdminResponse response, Map<Long, String> names) {
        Long memberId = response.memberId();
        String name = memberId == null ? null : names.get(memberId);
        return name == null ? response : response.withMember(new LinkedMember(memberId, name));
    }

    /** Người gọi phải là Admin đang hoạt động và đã duyệt, theo DB. */
    private static UserAccount requireAdmin(UserAccount actor) {
        if (actor == null || actor.getSystemRole() != SystemRole.ADMIN || !actor.isActiveAndApproved()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Bạn không có quyền thực hiện thao tác này.");
        }
        return actor;
    }

    private static void forbidSelf(UserAccount actor, UserAccount target) {
        if (actor.getId().equals(target.getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "SELF_ACTION_FORBIDDEN",
                    "Bạn không thể tự thực hiện thao tác này với chính mình.");
        }
    }

    /** Không để thao tác làm mất Admin đang hoạt động cuối cùng (không tính chính người bị tác động). */
    static void assertNotLastAdmin(UserAccount target, List<UserAccount> admins) {
        if (target.getSystemRole() != SystemRole.ADMIN || !target.isActiveAndApproved()) {
            return;
        }
        boolean anotherActiveAdmin = admins.stream()
                .anyMatch(a -> !a.getId().equals(target.getId()) && a.isActiveAndApproved());
        if (!anotherActiveAdmin) {
            throw new BusinessException(HttpStatus.CONFLICT, "LAST_ADMIN",
                    "Đây là Admin cuối cùng của hệ thống. Hãy cấp quyền Admin cho người khác trước.");
        }
    }

    private static void requireApproval(UserAccount target, ApprovalStatus... allowed) {
        for (ApprovalStatus a : allowed) {
            if (target.getApprovalStatus() == a) {
                return;
            }
        }
        throw invalidState();
    }

    private static void requireStatus(UserAccount target, AccountStatus allowed) {
        if (target.getStatus() != allowed) {
            throw invalidState();
        }
    }

    private static BusinessException invalidState() {
        return new BusinessException(HttpStatus.CONFLICT, "INVALID_ACCOUNT_STATE",
                "Trạng thái hiện tại của tài khoản không cho phép thao tác này.");
    }

    /** Chỉ các trường đổi trong thao tác quản trị; không có email, hash hay bí mật. */
    private static Map<String, Object> snapshot(UserAccount u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("systemRole", u.getSystemRole());
        m.put("status", u.getStatus());
        m.put("approvalStatus", u.getApprovalStatus());
        m.put("memberId", u.getMemberId());
        return m;
    }

    private static Specification<UserAccount> specOf(AccountFilter f) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();
            all.add(cb.notEqual(root.get("status"), AccountStatus.PENDING));
            if (f.approval() != null) {
                all.add(cb.equal(root.get("approvalStatus"), f.approval()));
            }
            if (f.status() != null) {
                all.add(cb.equal(root.get("status"), f.status()));
            }
            if (f.role() != null) {
                all.add(cb.equal(root.get("systemRole"), f.role()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                // Họ tên so theo collation ai_ci (không phân biệt hoa thường, bỏ dấu); email đã chữ thường
                String text = f.q().trim();
                String like = "%" + escapeLike(text) + "%";
                Predicate byName = cb.like(root.get("fullName"), like, '\\');
                // Cột email là ASCII: so với chuỗi có dấu thì MySQL báo lỗi collation, mà email cũng không thể khớp
                boolean canMatchEmail = StandardCharsets.US_ASCII.newEncoder().canEncode(text);
                all.add(canMatchEmail
                        ? cb.or(byName, cb.like(root.get("email"), like.toLowerCase(Locale.ROOT), '\\'))
                        : byName);
            }
            return cb.and(all.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
