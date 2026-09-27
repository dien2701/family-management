package vn.giapha.auth.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.auth.entity.EmailOtp;
import vn.giapha.auth.entity.OtpPurpose;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findFirstByEmailAndPurposeOrderByIdDesc(String email, OtpPurpose purpose);

    @Modifying
    @Query("delete from EmailOtp o where o.email = :email and o.purpose = :purpose")
    int deleteByEmailAndPurpose(@Param("email") String email, @Param("purpose") OtpPurpose purpose);

    @Modifying
    @Query("delete from EmailOtp o where o.id = :id")
    int deleteOne(@Param("id") Long id);

    /** Chiếm một lượt thử một cách nguyên tử; trả 0 khi đã hết lượt (chặn cả các request song song). */
    @Modifying
    @Query("update EmailOtp o set o.attempts = o.attempts + 1 where o.id = :id and o.attempts < :max")
    int claimAttempt(@Param("id") Long id, @Param("max") int max);

    @Modifying
    @Query("delete from EmailOtp o where o.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") Instant cutoff);

    @Modifying
    @Query("""
            delete from EmailOtp o where o.email in (
                select u.email from UserAccount u
                where u.status = vn.giapha.auth.entity.AccountStatus.PENDING and u.createdAt < :cutoff)""")
    int deleteOfPendingAccountsCreatedBefore(@Param("cutoff") Instant cutoff);
}
