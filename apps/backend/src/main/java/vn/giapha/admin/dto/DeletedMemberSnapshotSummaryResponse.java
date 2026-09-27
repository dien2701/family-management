package vn.giapha.admin.dto;

import java.time.Instant;

/** Một dòng trong danh sách "Thành viên đã xóa" (IDEA §6.10). */
public record DeletedMemberSnapshotSummaryResponse(Long auditId, Instant deletedAt, String deletedBy,
        String fullName) {
}
