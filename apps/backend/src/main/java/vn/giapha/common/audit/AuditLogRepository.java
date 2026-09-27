package vn.giapha.common.audit;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.Repository;

/** Cố ý chỉ khai báo đọc và ghi thêm: audit log không được xóa hay sửa. */
interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog auditLog);

    Optional<AuditLog> findById(Long id);

    Page<AuditLog> findByTargetTypeAndActionOrderByCreatedAtDescIdDesc(String targetType, String action,
            Pageable pageable);
}
