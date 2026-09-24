package vn.giapha.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.security.RateLimiter.Policy;

class RateLimiterTest {

    private final RateLimiter limiter = new RateLimiter();
    private final Policy twoPerHour = new Policy("test-two-per-hour", 2, Duration.ofHours(1));

    @Test
    void allowsUpToCapacityThenReportsWaitSeconds() {
        assertThat(limiter.tryAcquire(twoPerHour, "k")).isZero();
        assertThat(limiter.tryAcquire(twoPerHour, "k")).isZero();
        long wait = limiter.tryAcquire(twoPerHour, "k");
        assertThat(wait).isBetween(1L, 3601L);
    }

    @Test
    void keysAreIndependent() {
        limiter.tryAcquire(twoPerHour, "a");
        limiter.tryAcquire(twoPerHour, "a");
        assertThat(limiter.tryAcquire(twoPerHour, "a")).isPositive();
        assertThat(limiter.tryAcquire(twoPerHour, "b")).isZero();
    }

    @Test
    void acquireOrThrowGivesTooManyRequestsWithSecondsInMessage() {
        Policy one = new Policy("test-one", 1, Duration.ofMinutes(1));
        limiter.acquireOrThrow(one, "k", "RATE_LIMITED", "Chờ {seconds} giây.");

        assertThatThrownBy(() -> limiter.acquireOrThrow(one, "k", "RATE_LIMITED", "Chờ {seconds} giây."))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(429);
                    assertThat(e.getCode()).isEqualTo("RATE_LIMITED");
                    assertThat(e.getMessage()).matches("Chờ \\d+ giây\\.");
                });
    }
}
