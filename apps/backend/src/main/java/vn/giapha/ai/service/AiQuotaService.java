package vn.giapha.ai.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.concurrent.atomic.AtomicInteger;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.ai.dto.AiQuota;
import vn.giapha.ai.entity.AiUsage;
import vn.giapha.ai.repository.AiUsageRepository;
import vn.giapha.common.config.DynamicSettings;
import vn.giapha.common.exception.BusinessException;

/**
 * Lượt hỏi AI trong ngày (IDEA §10; DECISIONS #73, #91): User 15, Admin 30, khách 15 (đọc từ {@link DynamicSettings},
 * đổi được lúc chạy). Reset lúc 0h giờ Việt Nam bằng cách so ngày, không cần job riêng ({@link AiUsage#increment}).
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

    /** Trả lại lượt đã trừ ở {@link #checkAndIncrement} khi Gemini lỗi, để người dùng không mất lượt oan. */
    @Transactional
    public void refund(Long accountId) {
        repository.findByIdForUpdate(accountId).ifPresent(u -> {
            u.decrement(today(), Instant.now(clock));
            repository.save(u);
        });
    }

    // ---------- Khách (DECISIONS #91) ----------

    /**
     * Đếm lượt của khách theo mã thiết bị trong bộ nhớ, giống rate limit (DECISIONS #19): mất khi restart, một instance.
     * Khóa gồm ngày giờ Việt Nam nên qua 0h tự sang bộ đếm mới; mục cũ tự hết hạn sau 24 giờ.
     */
    private final Cache<String, AtomicInteger> guestUsage = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofHours(24)).maximumSize(100_000).build();

    public AiQuota getGuest(String guestKey) {
        int limit = settings.aiQuotaGuest();
        AtomicInteger counter = guestUsage.getIfPresent(guestDayKey(guestKey));
        int used = counter == null ? 0 : counter.get();
        return new AiQuota(limit, used, Math.max(0, limit - used), resetAt());
    }

    /** Như {@link #checkAndIncrement} nhưng cho khách; hạn mức 0 là tắt AI với khách. */
    public AiQuota checkAndIncrementGuest(String guestKey) {
        int limit = settings.aiQuotaGuest();
        AtomicInteger counter = guestUsage.get(guestDayKey(guestKey), k -> new AtomicInteger());
        int used = counter.incrementAndGet();
        if (used > limit) {
            counter.decrementAndGet();
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "AI_QUOTA_EXCEEDED", limit == 0
                    ? "Trợ lý AI chưa mở cho khách. Vui lòng đăng nhập để sử dụng."
                    : "Bạn đã dùng hết lượt hỏi AI hôm nay. Đăng nhập để có thêm lượt; lượt hỏi được đặt lại lúc 0h.");
        }
        return new AiQuota(limit, used, Math.max(0, limit - used), resetAt());
    }

    public void refundGuest(String guestKey) {
        AtomicInteger counter = guestUsage.getIfPresent(guestDayKey(guestKey));
        if (counter != null) {
            counter.updateAndGet(v -> Math.max(0, v - 1));
        }
    }

    private String guestDayKey(String guestKey) {
        return today() + "|" + guestKey;
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(VIETNAM));
    }

    private Instant resetAt() {
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(VIETNAM));
        return now.toLocalDate().plusDays(1).atStartOfDay(VIETNAM).toInstant();
    }
}
