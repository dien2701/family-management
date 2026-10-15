package vn.giapha.notification.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Thân {@code PushSubscription} của trình duyệt (chuẩn W3C Push API), khớp {@code shared/api/openapi.yaml}. */
public record PushSubscribeRequest(
        @NotBlank(message = "Thiếu endpoint.") String endpoint,
        @NotNull(message = "Thiếu keys.") @Valid Keys keys) {

    public record Keys(
            @NotBlank(message = "Thiếu p256dh.") @Size(max = 255, message = "p256dh quá dài.") String p256dh,
            @NotBlank(message = "Thiếu auth.") @Size(max = 255, message = "auth quá dài.") String auth) {
    }
}
