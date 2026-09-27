package vn.giapha.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.SystemRole;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.common.exception.BusinessException;

/**
 * Luật "Admin cuối cùng" (IDEA §3). Qua API không thể chạm tới nhánh này vì người gọi luôn là một Admin đang hoạt động
 * và còn lại sau thao tác, nên kiểm trực tiếp luật; còn việc hai Admin cùng gỡ nhau song song đã có test ở
 * {@code AdminAccountApiTest}.
 */
class LastAdminGuardTest {

    @Test
    void refusesWhenTargetIsTheOnlyActiveAdmin() {
        UserAccount only = admin(1, AccountStatus.ACTIVE, true);

        assertThatThrownBy(() -> AdminAccountService.assertNotLastAdmin(only, List.of(only)))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getCode()).isEqualTo("LAST_ADMIN");
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });
    }

    @Test
    void otherAdminsThatCannotActDoNotCount() {
        UserAccount target = admin(1, AccountStatus.ACTIVE, true);
        UserAccount locked = admin(2, AccountStatus.LOCKED, true);
        UserAccount notApproved = admin(3, AccountStatus.ACTIVE, false);

        assertThatThrownBy(() -> AdminAccountService.assertNotLastAdmin(target, List.of(target, locked, notApproved)))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.getCode()).isEqualTo("LAST_ADMIN"));
    }

    @Test
    void allowsWhenAnotherActiveApprovedAdminRemains() {
        UserAccount target = admin(1, AccountStatus.ACTIVE, true);
        UserAccount other = admin(2, AccountStatus.ACTIVE, true);

        assertThatCode(() -> AdminAccountService.assertNotLastAdmin(target, List.of(target, other)))
                .doesNotThrowAnyException();
    }

    @Test
    void ignoresTargetsThatAreNotActiveAdmins() {
        UserAccount user = account(1, SystemRole.USER, AccountStatus.ACTIVE, true);
        UserAccount lockedAdmin = admin(2, AccountStatus.LOCKED, true);

        assertThatCode(() -> AdminAccountService.assertNotLastAdmin(user, List.of())).doesNotThrowAnyException();
        // Admin đã bị khóa vốn không còn tính là Admin hoạt động, gỡ quyền của họ không làm mất Admin nào
        assertThatCode(() -> AdminAccountService.assertNotLastAdmin(lockedAdmin, List.of(lockedAdmin)))
                .doesNotThrowAnyException();
    }

    private static UserAccount admin(long id, AccountStatus status, boolean approved) {
        return account(id, SystemRole.ADMIN, status, approved);
    }

    private static UserAccount account(long id, SystemRole role, AccountStatus status, boolean approved) {
        UserAccount u = new UserAccount("u" + id + "@example.com", "Người " + id, status, Instant.now());
        ReflectionTestUtils.setField(u, "id", id);
        u.setSystemRole(role);
        if (approved) {
            u.approve(1L, Instant.now());
        }
        return u;
    }
}
