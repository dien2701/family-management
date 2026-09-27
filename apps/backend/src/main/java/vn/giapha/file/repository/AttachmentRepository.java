package vn.giapha.file.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import vn.giapha.file.entity.Attachment;
import vn.giapha.file.entity.AttachmentKind;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByMemberIdAndKindOrderByCreatedAtDescIdDesc(Long memberId, AttachmentKind kind);

    /** Tài liệu chung: {@code member_id} rỗng. */
    List<Attachment> findByMemberIdIsNullAndKindOrderByCreatedAtDescIdDesc(AttachmentKind kind);

    /** Mọi tệp của một thành viên (ảnh đại diện và tài liệu), dùng khi xóa thành viên. */
    List<Attachment> findByMemberIdOrderByIdAsc(Long memberId);

    List<Attachment> findByMemberIdAndKind(Long memberId, AttachmentKind kind);

    boolean existsByPublicId(String publicId);

    /** Tổng dung lượng toàn hệ thống, tính vào quota 1 GB (DECISIONS #67). */
    @Query("select coalesce(sum(a.sizeBytes), 0) from Attachment a")
    long totalBytes();
}
