package vn.giapha.auth.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.auth.entity.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmail(String email);

    Optional<UserAccount> findByGoogleSub(String googleSub);

    /** Xóa tài khoản PENDING quá hạn; refresh_token đi theo nhờ ON DELETE CASCADE. */
    @Modifying
    @Query("delete from UserAccount u where u.status = vn.giapha.auth.entity.AccountStatus.PENDING and u.createdAt < :cutoff")
    int deletePendingCreatedBefore(@Param("cutoff") Instant cutoff);
}
