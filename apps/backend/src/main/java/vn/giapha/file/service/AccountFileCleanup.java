package vn.giapha.file.service;

import java.util.List;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AccountPurgedEvent;
import vn.giapha.file.entity.Attachment;
import vn.giapha.file.entity.AttachmentKind;
import vn.giapha.file.repository.AttachmentRepository;

/** Tài khoản bị xóa vĩnh viễn: xóa dòng ảnh đại diện tài khoản, hẹn xóa tệp trên Cloudinary sau khi commit. */
@Component
class AccountFileCleanup {

    private final AttachmentRepository attachments;
    private final StorageCleaner cleaner;

    AccountFileCleanup(AttachmentRepository attachments, StorageCleaner cleaner) {
        this.attachments = attachments;
        this.cleaner = cleaner;
    }

    @EventListener
    void on(AccountPurgedEvent event) {
        List<Attachment> rows = attachments.findByAccountIdAndKind(event.accountId(), AttachmentKind.ACCOUNT_AVATAR);
        attachments.deleteAll(rows);
        cleaner.deleteAfterCommit(rows);
    }
}
