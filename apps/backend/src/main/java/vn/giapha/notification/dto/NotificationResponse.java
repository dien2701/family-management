package vn.giapha.notification.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        String link,
        boolean isRead,
        Instant createdAt) {
}
