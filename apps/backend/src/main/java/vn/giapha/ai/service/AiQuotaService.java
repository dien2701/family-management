package vn.giapha.ai.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.ai.dto.AiQuota;
import vn.giapha.ai.entity.AiUsage;
import vn.giapha.ai.repository.AiUsageRepository;
import vn.giapha.common.config.DynamicSettings;
import vn.giapha.common.exception.BusinessException;

/**
 * Lượt hỏi AI trong ngày (IDEA §10; DECISIONS #73): User 15, Admin 30 (đọc từ {@link DynamicSettings}, đổi được lúc
 * chạy). Reset lúc 0h giờ Việt Nam bằng cách so ngày, không cần job riêng ({@link AiUsage#increment}).
 */
@Service
public class AiQuotaService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AiUsageRepository repository;
    private final DynamicSettings settings;
    private final Clock clock;

    AiQuotaService(AiUsageRepository repository, DynamicSettings settings, Clock clock) {
        this.repository = repository;
        this.settings = settings;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AiQuota get(Long accountId, boolean admin) {
        int limit = admin ? settings.aiQuotaAdmin() : settings.aiQuotaUser();
        LocalDate today = today();
        int used = repository.findById(accountId).map(u -> u.usedOn(today)).orElse(0);
        return new AiQuota(limit, used, Math.max(0, limit - used), resetAt());
    }

    /** Kiểm tra rồi tăng lượt đã dùng; 429 {@code AI_QUOTA_EXCEEDED} khi hết lượt trong ngày. */
    @Transactional
    public AiQuota checkAndIncrement(Long accountId, boolean admin) {
        int limit = admin ? settings.aiQuotaAdmin() : settings.aiQuotaUser();
        LocalDate today = today();
        AiUsage usage = repository.findByIdForUpdate(accountId).orElseGet(() -> new AiUsage(accountId, today, 0,
                Instant.now(clock)));
        if (usage.usedOn(today) >= limit) {
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "AI_QUOTA_EXCEEDED",
                    "Bạn đã dùng hết lượt hỏi AI hôm nay. Lượt hỏi được đặt lại lúc 0h.");
        }
        usage.increment(today, Instant.now(clock));
        repository.save(usage);
        int used = usage.usedOn(today);
        return new AiQuota(limit, used, Math.max(0, limit - used), resetAt());
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(VIETNAM));
    }

    private Instant resetAt() {
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(VIETNAM));
        return now.toLocalDate().plusDays(1).atStartOfDay(VIETNAM).toInstant();
    }
}
