package vn.giapha.common.audit;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Đọc audit log cho module khác (quản trị: thành viên đã xóa). Chỉ trả bản sao chỉ-đọc. */
@Component
public class AuditLogReader {

    /** Một dòng audit log; {@code beforeData} là JSON thô của bản sao đã ghi lúc thao tác. */
    public record Row(Long auditId, Instant createdAt, Long actorId, String beforeData) {
    }

    private final AuditLogRepository repository;

    AuditLogReader(AuditLogRepository repository) {
        this.repository = repository;
    }

    /** Các dòng khớp {@code targetType}/{@code action}, mới nhất trước. */
    @Transactional(readOnly = true)
    public Page<Row> find(String targetType, String action, Pageable pageable) {
        return repository.findByTargetTypeAndActionOrderByCreatedAtDescIdDesc(targetType, action, pageable)
                .map(AuditLogReader::toRow);
    }

    /** Một dòng theo id, chỉ trả nếu khớp {@code targetType}/{@code action} (tránh lộ audit log của việc khác). */
    @Transactional(readOnly = true)
    public Optional<Row> findOne(Long auditId, String targetType, String action) {
        return repository.findById(auditId)
                .filter(a -> targetType.equals(a.getTargetType()) && action.equals(a.getAction()))
                .map(AuditLogReader::toRow);
    }

    private static Row toRow(AuditLog a) {
        return new Row(a.getId(), a.getCreatedAt(), a.getActorId(), a.getBeforeData());
    }
}
