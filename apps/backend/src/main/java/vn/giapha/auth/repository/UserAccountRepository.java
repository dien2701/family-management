package vn.giapha.auth.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.auth.entity.UserAccount;

public interface UserAccountRepository
        extends JpaRepository<UserAccount, Long>, JpaSpecificationExecutor<UserAccount> {

    Optional<UserAccount> findByEmail(String email);

    /** Có Admin dùng được (ACTIVE và đã duyệt) hay chưa; Admin bị khóa/từ chối không tính. */
    @Query("""
            select count(u) > 0 from UserAccount u
            where u.systemRole = vn.giapha.auth.entity.SystemRole.ADMIN
              and u.status = vn.giapha.auth.entity.AccountStatus.ACTIVE
              and u.approvalStatus = vn.giapha.auth.entity.ApprovalStatus.APPROVED""")
    boolean existsUsableAdmin();

    /** Khóa dòng tài khoản để các thao tác duyệt/khóa/đổi vai trò trên cùng một người chạy tuần tự. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserAccount u where u.id = :id")
    Optional<UserAccount> findByIdForUpdate(@Param("id") Long id);

    /**
     * Khóa mọi dòng Admin theo thứ tự id. Mọi thao tác quản trị khóa theo thứ tự này trước, nên hai Admin cùng gỡ
     * quyền hoặc khóa nhau chạy tuần tự và không thể để lại hệ thống không còn Admin nào.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserAccount u where u.systemRole = vn.giapha.auth.entity.SystemRole.ADMIN order by u.id")
    List<UserAccount> lockAllAdmins();

    Optional<UserAccount> findByGoogleSub(String googleSub);

    boolean existsByMemberId(Long memberId);

    /** Gỡ liên kết của thành viên sắp bị xóa; tài khoản vẫn còn (IDEA §6.1). */
    @Modifying(flushAutomatically = true)
    @Query("update UserAccount u set u.memberId = null where u.memberId = :memberId")
    int clearMember(@Param("memberId") Long memberId);

    /** Xóa tài khoản PENDING quá hạn; refresh_token đi theo nhờ ON DELETE CASCADE. */
    @Modifying
    @Query("delete from UserAccount u where u.status = vn.giapha.auth.entity.AccountStatus.PENDING and u.createdAt < :cutoff")
    int deletePendingCreatedBefore(@Param("cutoff") Instant cutoff);
}
