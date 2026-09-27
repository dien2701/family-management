package vn.giapha.ai.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.giapha.ai.repository.AiMessageRepository;

/** Dọn tin nhắn AI cũ hơn 30 ngày (IDEA §10), chạy mỗi ngày lúc 3h sáng giờ Việt Nam. */
@Component
class AiMessageCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(AiMessageCleanupJob.class);
    private static final Duration RETENTION = Duration.ofDays(30);

    private final AiMessageRepository messages;
    private final Clock clock;

    AiMessageCleanupJob(AiMessageRepository messages, Clock clock) {
        this.messages = messages;
        this.clock = clock;
    }

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        Instant cutoff = Instant.now(clock).minus(RETENTION);
        long deleted = messages.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Đã xóa {} tin nhắn AI cũ hơn 30 ngày", deleted);
        }
    }
}
