package vn.giapha.common.security;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.giapha.common.exception.BusinessException;

/**
 * Rate limit trong bộ nhớ (bucket4j + Caffeine, DECISIONS #19): chấp nhận mất khi restart vì chỉ chạy một instance.
 * Mỗi {@link Policy} có cache riêng, bucket nhàn rỗi quá chu kỳ nạp lại thì bỏ đi (tương đương đã nạp đầy).
 */
@Component
public class RateLimiter {

    /** Tối đa {@code capacity} lần mỗi {@code refillPeriod} cho từng khóa. */
    public record Policy(String name, long capacity, Duration refillPeriod) {
    }

    private static final long MAX_KEYS_PER_POLICY = 100_000;

    private final ConcurrentHashMap<String, Cache<String, Bucket>> caches = new ConcurrentHashMap<>();

    /** @return 0 nếu được phép, ngược lại số giây phải chờ. */
    public long tryAcquire(Policy policy, String key) {
        Bucket bucket = caches.computeIfAbsent(policy.name(), n -> Caffeine.newBuilder()
                        .expireAfterAccess(policy.refillPeriod().toNanos(), TimeUnit.NANOSECONDS)
                        .maximumSize(MAX_KEYS_PER_POLICY)
                        .build())
                .get(key, k -> Bucket.builder()
                        .addLimit(Bandwidth.builder().capacity(policy.capacity())
                                .refillIntervally(policy.capacity(), policy.refillPeriod()).build())
                        .build());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            return 0;
        }
        return Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()) + 1);
    }

    /** Như {@link #tryAcquire} nhưng ném 429 khi vượt hạn mức; {@code {seconds}} trong message được thay bằng số giây chờ. */
    public void acquireOrThrow(Policy policy, String key, String code, String message) {
        long wait = tryAcquire(policy, key);
        if (wait > 0) {
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, code,
                    message.replace("{seconds}", String.valueOf(wait)));
        }
    }
}
