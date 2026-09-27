package vn.giapha.file.service;

import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import vn.giapha.file.entity.Attachment;
import vn.giapha.file.entity.FileFormat;
import vn.giapha.file.storage.FileStorage;

/**
 * Xóa tệp trên Cloudinary <b>sau khi transaction commit</b> (DECISIONS #62): rollback thì tệp còn nguyên, commit rồi
 * mà kho lỗi thì chỉ còn tệp mồ côi (đã ghi log), dữ liệu không bị lệch.
 */
@Component
class StorageCleaner {

    private final FileStorage storage;

    StorageCleaner(FileStorage storage) {
        this.storage = storage;
    }

    void deleteAfterCommit(Collection<Attachment> files) {
        if (files.isEmpty()) {
            return;
        }
        // Chụp lại giá trị ngay: entity có thể đã bị detach khi callback chạy
        List<Target> targets = files.stream().map(a -> new Target(a.getPublicId(), a.getFormat())).toList();
        Runnable task = () -> targets.forEach(t -> storage.delete(t.publicId(), t.format()));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    task.run();
                }
            });
        } else {
            task.run();
        }
    }

    private record Target(String publicId, FileFormat format) {
    }
}
