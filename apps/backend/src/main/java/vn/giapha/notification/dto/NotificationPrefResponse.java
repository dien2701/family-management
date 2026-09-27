package vn.giapha.notification.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

/**
 * Tùy chọn thông báo; cũng dùng làm nội dung {@code PUT}. {@code remindDaysBefore}/{@code remindHour} dùng cho job
 * gộp bản tin theo giờ (Đợt 35, IDEA §9 mục 4).
 */
public record NotificationPrefResponse(
        boolean notifyEvents,
        boolean notifyMemorials,
        boolean notifyProposals,
        @NotEmpty(message = "Chọn ít nhất một mốc nhắc.") List<Integer> remindDaysBefore,
        @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Giờ nhận không hợp lệ.") String remindHour) {
}
