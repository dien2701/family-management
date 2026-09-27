package vn.giapha.member.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.member.entity.MemberRelative;

public interface MemberRelativeRepository extends JpaRepository<MemberRelative, Long> {

    List<MemberRelative> findByMemberIdOrderByCreatedAtAscIdAsc(Long memberId);

    Optional<MemberRelative> findByIdAndMemberId(Long id, Long memberId);

    boolean existsByMemberIdAndRelativeMemberId(Long memberId, Long relativeMemberId);

    /** Các dòng dính tới thành viên ở cả hai phía, để lưu vào snapshot trước khi xóa. */
    @Query("select r from MemberRelative r where r.memberId = :id or r.relativeMemberId = :id order by r.id")
    List<MemberRelative> findAllInvolving(@Param("id") Long memberId);

    /** Xóa mọi dòng dính tới thành viên: hồ sơ của họ và các dòng nhắc tới họ trong hồ sơ người khác. */
    @Modifying(flushAutomatically = true)
    @Query("delete from MemberRelative r where r.memberId = :id or r.relativeMemberId = :id")
    int deleteAllInvolving(@Param("id") Long memberId);
}
