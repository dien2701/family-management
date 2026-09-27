package vn.giapha.member.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.entity.MemberLinkRequest;

public interface MemberLinkRequestRepository extends JpaRepository<MemberLinkRequest, Long> {

    /** Hàng đợi của Admin: cũ nhất trước. */
    List<MemberLinkRequest> findAllByOrderByCreatedAtAscIdAsc();

    List<MemberLinkRequest> findByStatusOrderByCreatedAtAscIdAsc(LinkRequestStatus status);

    /** Yêu cầu của một tài khoản: mới nhất trước. */
    List<MemberLinkRequest> findByAccountIdOrderByCreatedAtDescIdDesc(Long accountId);

    boolean existsByAccountIdAndStatus(Long accountId, LinkRequestStatus status);

    /** Số yêu cầu đang chờ duyệt (dashboard, IDEA §6.8). */
    long countByStatus(LinkRequestStatus status);

    List<MemberLinkRequest> findByAccountIdAndStatus(Long accountId, LinkRequestStatus status);

    List<MemberLinkRequest> findByMemberIdAndStatus(Long memberId, LinkRequestStatus status);

    /** Chỉ đọc id tài khoản (không nạp entity vào phiên) để khóa tài khoản trước khi khóa yêu cầu. */
    @Query("select r.accountId from MemberLinkRequest r where r.id = :id")
    Optional<Long> findAccountIdById(@Param("id") Long id);

    /** Khóa dòng để hai Admin cùng duyệt một yêu cầu chạy tuần tự. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from MemberLinkRequest r where r.id = :id")
    Optional<MemberLinkRequest> findByIdForUpdate(@Param("id") Long id);
}
