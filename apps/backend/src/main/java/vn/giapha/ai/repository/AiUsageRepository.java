package vn.giapha.ai.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import vn.giapha.ai.entity.AiUsage;

public interface AiUsageRepository extends JpaRepository<AiUsage, Long> {

    /** Khóa dòng để tăng lượt đã dùng tuần tự, tránh vượt hạn mức khi hai lượt hỏi cùng lúc. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from AiUsage u where u.accountId = :accountId")
    Optional<AiUsage> findByIdForUpdate(@Param("accountId") Long accountId);
}
