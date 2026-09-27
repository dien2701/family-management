package vn.giapha.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record PushUnsubscribeRequest(@NotBlank(message = "Thiếu endpoint.") String endpoint) {
}
