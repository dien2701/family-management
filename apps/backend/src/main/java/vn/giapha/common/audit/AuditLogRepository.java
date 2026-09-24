package vn.giapha.common.audit;

import org.springframework.data.repository.Repository;

/** Cố ý chỉ khai báo save: audit log không được xóa hay sửa. */
interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog auditLog);
}
