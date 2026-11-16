package vn.giapha.admin.dto;

import jakarta.validation.constraints.Min;

/** Cấu hình hệ thống (IDEA §6.10); dùng cho cả đọc và ghi ({@code GET}/{@code PUT /api/admin/settings}). */
public record SystemSettingsResponse(
        @Min(value = 1, message = "Phiên bản chính sách phải từ 1.") int policyVersion,
        @Min(value = 1, message = "Lượt hỏi AI của Người dùng phải từ 1.") int aiQuotaUser,
        @Min(value = 1, message = "Lượt hỏi AI của Quản trị viên phải từ 1.") int aiQuotaAdmin,
        @Min(value = 1, message = "Lượt hỏi AI của Trưởng chi phải từ 1.") int aiQuotaBranchHead,
        @Min(value = 0, message = "Lượt hỏi AI của khách phải từ 0.") int aiQuotaGuest,
        @Min(value = 1, message = "Dung lượng tối đa mỗi tệp phải từ 1 MB.") int uploadMaxMb,
        @Min(value = 1, message = "Tổng dung lượng phải từ 1 MB.") int totalQuotaMb) {
}
