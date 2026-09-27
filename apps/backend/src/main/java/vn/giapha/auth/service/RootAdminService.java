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
 * Admin gốc (IDEA §3, DECISIONS #55): email khai ở {@code ROOT_ADMIN_EMAIL} tự thành ADMIN + APPROVED khi xác thực OTP
 * hoặc đăng nhập (mật khẩu, Google), nhưng chỉ khi hệ thống chưa có Admin nào. Sau đó là Admin như mọi Admin khác.
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

    /**
     * Nâng {@code user} lên Admin nếu là email gốc và chưa có Admin dùng được nào (ACTIVE, đã duyệt; Admin bị khóa/từ chối không tính, để Admin gốc còn cứu được hệ thống); trả bản để phát token.
     *
     * <p>Đã có Admin thì thoát ngay, không khóa gì (trường hợp thường gặp). Chưa có thì khóa dòng tài khoản, đọc lại
     * bằng đọc-khóa (thấy thay đổi mới nhất của request song song, không dùng snapshot của transaction) rồi mới quyết,
     * nên hai request cùng email chỉ nâng một lần. Chỉ một email khai được là Admin gốc nên không có hai tài khoản
     * khác nhau cùng được nâng.
     */
    @Transactional
    public UserAccount promoteIfRoot(UserAccount user) {
        if (rootEmail.isEmpty() || !rootEmail.equals(user.getEmail()) || user.getStatus() != AccountStatus.ACTIVE
                || users.existsUsableAdmin()) {
            return user;
        }
        UserAccount locked = users.findById(user.getId()).orElse(user);
        // Đẩy thay đổi chưa ghi của transaction gọi (vd. vừa chuyển ACTIVE) xuống DB trước khi khóa và đọc lại
        users.flush();
        em.refresh(locked, LockModeType.PESSIMISTIC_WRITE);
        if (locked.getStatus() != AccountStatus.ACTIVE || locked.getSystemRole() == SystemRole.ADMIN
                || users.lockAllAdmins().stream().anyMatch(UserAccount::isActiveAndApproved)) {
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
}
