package vn.giapha.admin.dto;

import jakarta.validation.constraints.Min;

/** Cấu hình hệ thống (IDEA §6.10); dùng cho cả đọc và ghi ({@code GET}/{@code PUT /api/admin/settings}). */
public record SystemSettingsResponse(
        @Min(value = 1, message = "Phiên bản chính sách phải từ 1.") int policyVersion,
        @Min(value = 1, message = "Lượt hỏi AI của User phải từ 1.") int aiQuotaUser,
        @Min(value = 1, message = "Lượt hỏi AI của Admin phải từ 1.") int aiQuotaAdmin,
        @Min(value = 1, message = "Dung lượng tối đa mỗi tệp phải từ 1 MB.") int uploadMaxMb,
        @Min(value = 1, message = "Tổng dung lượng phải từ 1 MB.") int totalQuotaMb) {
}
