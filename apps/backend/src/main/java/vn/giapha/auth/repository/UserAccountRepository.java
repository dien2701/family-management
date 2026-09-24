package vn.giapha.auth.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.auth.entity.FamilyRole;
import vn.giapha.auth.entity.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmail(String email);

    Optional<UserAccount> findByGoogleSub(String googleSub);

    List<UserAccount> findByFamilyId(Long familyId);

    // Hai truy vấn "exists" luôn đọc thẳng DB (không qua persistence context) nên dùng để kiểm quyền sau khi khóa family
    boolean existsByIdAndFamilyIdAndFamilyRole(Long id, Long familyId, FamilyRole familyRole);

    boolean existsByIdAndFamilyIdAndStatus(Long id, Long familyId, vn.giapha.auth.entity.AccountStatus status);

    /**
     * Gán family cho tài khoản ACTIVE (không phải Admin) chưa thuộc family nào. UPDATE có điều kiện nên hai request
     * song song chỉ một cái thành công.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update UserAccount u set u.familyId = :familyId, u.familyRole = :role
            where u.id = :id and u.familyId is null
              and u.status = vn.giapha.auth.entity.AccountStatus.ACTIVE
              and u.systemRole = vn.giapha.auth.entity.SystemRole.USER""")
    int assignFamily(@Param("id") Long id, @Param("familyId") Long familyId, @Param("role") FamilyRole role);

    /** Gỡ khỏi family (và gỡ liên kết member) nếu đang thuộc đúng family đó. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update UserAccount u set u.familyId = null, u.familyRole = null, u.memberId = null
            where u.id = :id and u.familyId = :familyId""")
    int clearFamily(@Param("id") Long id, @Param("familyId") Long familyId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update UserAccount u set u.familyRole = :role where u.id = :id and u.familyId = :familyId")
    int updateFamilyRole(@Param("id") Long id, @Param("familyId") Long familyId, @Param("role") FamilyRole role);

    /** Xóa tài khoản PENDING quá hạn; refresh_token đi theo nhờ ON DELETE CASCADE. */
    @Modifying
    @Query("delete from UserAccount u where u.status = vn.giapha.auth.entity.AccountStatus.PENDING and u.createdAt < :cutoff")
    int deletePendingCreatedBefore(@Param("cutoff") Instant cutoff);
}
