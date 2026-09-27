package vn.giapha.event.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import vn.giapha.event.entity.EventCalendar;

/**
 * Nội dung sự kiện chung khi thêm hoặc sửa (PUT thay toàn bộ). {@code year = null} nghĩa là lặp hằng năm.
 * Quy tắc ngày (âm/dương có thật, khoảng năm hỗ trợ, tháng nhuận) do {@code EventInputParser} kiểm tra.
 */
public record CustomEventInput(
        @Size(max = 200, message = "Tên sự kiện tối đa 200 ký tự.") String title,
        @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự.") String description,
        @NotNull(message = "Chọn lịch dương hoặc âm.") EventCalendar calendar,
        @NotNull(message = "Vui lòng nhập ngày.") Integer day,
        @NotNull(message = "Vui lòng nhập tháng.") Integer month,
        Integer year,
        Boolean leap) {
}
