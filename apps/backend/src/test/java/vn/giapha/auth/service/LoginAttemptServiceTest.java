package vn.giapha.auth.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import com.github.benmanes.caffeine.cache.Ticker;

import org.junit.jupiter.api.Test;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.support.TestProps;

class LoginAttemptServiceTest {

    private final AtomicLong nanos = new AtomicLong();
    private final Ticker ticker = nanos::get;
    private final LoginAttemptService service = new LoginAttemptService(TestProps.defaults(), ticker);

    @Test
    void allowsFiveAttemptsThenLocksForFifteenMinutes() {
        for (int i = 0; i < 5; i++) {
            service.beginAttempt("a@x.vn");
        }
        assertThatThrownBy(() -> service.beginAttempt("a@x.vn"))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    org.assertj.core.api.Assertions.assertThat(e.getCode()).isEqualTo("LOGIN_LOCKED");
                    org.assertj.core.api.Assertions.assertThat(e.getStatus().value()).isEqualTo(429);
                });

        advance(Duration.ofMinutes(14));
        assertThatThrownBy(() -> service.beginAttempt("a@x.vn")).isInstanceOf(BusinessException.class);

        advance(Duration.ofMinutes(2));
        assertThatCode(() -> service.beginAttempt("a@x.vn")).doesNotThrowAnyException();
    }

    @Test
    void rejectedAttemptsDoNotExtendTheLock() {
        for (int i = 0; i < 6; i++) {
            try {
                service.beginAttempt("a@x.vn");
            } catch (BusinessException ignored) {
                // lượt thứ 6 bị khóa
            }
        }
        advance(Duration.ofMinutes(10));
        assertThatThrownBy(() -> service.beginAttempt("a@x.vn")).isInstanceOf(BusinessException.class);
        advance(Duration.ofMinutes(6)); // tổng 16 phút kể từ lượt bị từ chối đầu tiên
        assertThatCode(() -> service.beginAttempt("a@x.vn")).doesNotThrowAnyException();
    }

    @Test
    void resetClearsTheCounterAndEmailsAreIndependent() {
        for (int i = 0; i < 5; i++) {
            service.beginAttempt("a@x.vn");
        }
        service.reset("a@x.vn");
        assertThatCode(() -> service.beginAttempt("a@x.vn")).doesNotThrowAnyException();

        for (int i = 0; i < 5; i++) {
            service.beginAttempt("b@x.vn");
        }
        assertThatCode(() -> service.beginAttempt("c@x.vn")).doesNotThrowAnyException();
    }

    private void advance(Duration d) {
        nanos.addAndGet(d.toNanos());
    }
}
