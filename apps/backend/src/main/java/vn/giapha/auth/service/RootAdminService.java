package vn.giapha.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.config.AppProperties;

/**
 * Admin gốc (IDEA §3, DECISIONS #55, #98): email khai ở {@code ROOT_ADMIN_EMAIL} tự thành ADMIN + APPROVED mỗi khi
 * xác thực OTP hoặc đăng nhập (mật khẩu, Google), kể cả khi đã có Admin khác. Quyền như mọi Admin, nhưng Admin khác
 * không gỡ quyền, khóa, từ chối hay xóa được (chặn ở {@code AdminAccountService}).
 */
@Service
public class RootAdminService {

    private final UserAccountRepository users;
    private final AuditLogWriter audit;
    private final EntityManager em;
    private final Clock clock;
    private final String rootEmail;

    RootAdminService(UserAccountRepository users, AuditLogWriter audit, EntityManager em, Clock clock,
            AppProperties props) {
        this.users = users;
        this.audit = audit;
        this.em = em;
        this.clock = clock;
        this.rootEmail = props.rootAdminEmail().trim().toLowerCase(Locale.ROOT);
    }

    /** Tài khoản này có phải Admin gốc (email trùng {@code ROOT_ADMIN_EMAIL}) không. */
    public boolean isRoot(UserAccount user) {
        return !rootEmail.isEmpty() && rootEmail.equals(user.getEmail());
    }

    /**
     * Nâng {@code user} lên ADMIN + APPROVED nếu là email gốc và chưa đủ cả hai; trả bản để phát token.
     *
     * <p>Đã là Admin đã duyệt thì thoát ngay, không khóa gì (trường hợp thường gặp). Chưa thì khóa dòng tài khoản, đọc
     * lại bằng đọc-khóa (thấy thay đổi mới nhất của request song song, không dùng snapshot của transaction) rồi mới
     * quyết, nên hai request cùng email chỉ nâng một lần.
     */
    @Transactional
    public UserAccount promoteIfRoot(UserAccount user) {
        if (!isRoot(user) || user.getStatus() != AccountStatus.ACTIVE || isPromoted(user)) {
            return user;
        }
        UserAccount locked = users.findById(user.getId()).orElse(user);
        // Đẩy thay đổi chưa ghi của transaction gọi (vd. vừa chuyển ACTIVE) xuống DB trước khi khóa và đọc lại
        users.flush();
        em.refresh(locked, LockModeType.PESSIMISTIC_WRITE);
        if (locked.getStatus() != AccountStatus.ACTIVE || isPromoted(locked)) {
            return locked;
        }
        Map<String, Object> before = Map.of("systemRole", locked.getSystemRole(),
                "approvalStatus", locked.getApprovalStatus());
        locked.setSystemRole(SystemRole.ADMIN);
        locked.approve(locked.getId(), Instant.now(clock));
        audit.write(locked.getId(), "ROOT_ADMIN_PROMOTE", "ACCOUNT", locked.getId(), before,
                Map.of("systemRole", SystemRole.ADMIN, "approvalStatus", ApprovalStatus.APPROVED));
        return locked;
    }

    private static boolean isPromoted(UserAccount u) {
        return u.getSystemRole() == SystemRole.ADMIN && u.getApprovalStatus() == ApprovalStatus.APPROVED;
    }
}
