package vn.giapha.notification.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Tùy chọn nhận bản tin của thiết bị khách (DECISIONS #89), khớp {@code GuestPushPref} trong openapi.yaml. */
public record GuestPushPref(
        @NotNull(message = "Thiếu tùy chọn sự kiện.") Boolean notifyEvents,
        @NotNull(message = "Thiếu tùy chọn ngày giỗ.") Boolean notifyMemorials,
        @NotEmpty(message = "Chọn ít nhất một mốc nhắc.")
        @Size(max = 10, message = "Tối đa 10 mốc nhắc.") List<@NotNull @Min(value = 0, message = "Mốc nhắc từ 0 đến 30 ngày.") @Max(value = 30, message = "Mốc nhắc từ 0 đến 30 ngày.") Integer> remindDaysBefore,
        @NotNull(message = "Thiếu giờ nhận.")
        @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Giờ nhận không hợp lệ.") String remindHour) {
}
