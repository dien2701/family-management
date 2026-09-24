package vn.giapha.family.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.family.entity.Family;

public interface FamilyRepository extends JpaRepository<Family, Long> {

    /** Khóa dòng family để các thay đổi thành viên/Manager của cùng một family chạy tuần tự. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Family f where f.id = :id")
    Optional<Family> findByIdForUpdate(@Param("id") Long id);
}
