package vn.giapha.file.service;

import java.util.List;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.file.dto.AttachmentResponse;
import vn.giapha.file.entity.Attachment;
import vn.giapha.file.repository.AttachmentRepository;
import vn.giapha.member.MemberDeletedEvent;
import vn.giapha.member.MemberSnapshotContributor;

/**
 * Nối module file vào việc xóa thành viên (DECISIONS #62): đưa các tệp vào phần {@code "attachments"} của snapshot,
 * rồi khi {@link MemberDeletedEvent} phát (đồng bộ, trong transaction xóa) thì xóa các dòng và hẹn xóa tệp trên
 * Cloudinary sau khi commit.
 */
@Component
class MemberFileCleanup implements MemberSnapshotContributor {

    private final AttachmentRepository attachments;
    private final StorageCleaner cleaner;

    MemberFileCleanup(AttachmentRepository attachments, StorageCleaner cleaner) {
        this.attachments = attachments;
        this.cleaner = cleaner;
    }

    @Override
    public String section() {
        return "attachments";
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponse> collect(Long memberId) {
        return attachments.findByMemberIdOrderByIdAsc(memberId).stream().map(AttachmentResponse::of).toList();
    }

    @EventListener
    void on(MemberDeletedEvent event) {
        List<Attachment> rows = attachments.findByMemberIdOrderByIdAsc(event.memberId());
        attachments.deleteAll(rows);
        cleaner.deleteAfterCommit(rows);
    }
}
