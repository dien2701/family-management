package vn.giapha.notification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Thân {@code PUT /api/push/guest}: subscription của trình duyệt kèm tùy chọn (bỏ trống = giữ nguyên). */
public record GuestPushRequest(
        @NotBlank(message = "Thiếu endpoint.") @Size(max = 500, message = "Endpoint quá dài.") String endpoint,
        @NotNull(message = "Thiếu keys.") @Valid PushSubscribeRequest.Keys keys,
        @Valid GuestPushPref pref) {
}
