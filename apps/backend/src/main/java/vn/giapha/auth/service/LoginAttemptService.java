package vn.giapha.auth.service;

import java.util.concurrent.TimeUnit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;

/**
 * Khóa đăng nhập theo email (DECISIONS #19): mỗi email được {@code loginMaxFailures} lần thử trong một cửa sổ,
 * lần thử tiếp theo bị khóa {@code loginLockDuration}, dù mật khẩu có đúng.
 * <p>
 * Lượt thử được tính <b>trước</b> khi kiểm tra mật khẩu và chỉ xóa khi đăng nhập thành công, để các request
 * song song không lách được giới hạn. Bộ đếm sống trong Caffeine với {@code expireAfterWrite}: hạn được làm mới
 * ở mỗi lượt thử, nên khóa hết 15 phút sau lượt bị từ chối đầu tiên (các lượt bị từ chối sau đó không kéo dài khóa).
 * Đếm cả email không tồn tại để phản hồi không lộ email nào có thật.
 */
@Service
public class LoginAttemptService {

    private static final long MAX_TRACKED_EMAILS = 100_000;

    private final Cache<String, Integer> attempts;
    private final int maxFailures;
    private final long lockMinutes;

    @Autowired
    LoginAttemptService(AppProperties props) {
        this(props, Ticker.systemTicker());
    }

    /** Cho test đẩy đồng hồ tới trước mà không phải chờ 15 phút. */
    LoginAttemptService(AppProperties props, Ticker ticker) {
        this.maxFailures = props.auth().loginMaxFailures();
        this.lockMinutes = props.auth().loginLockDuration().toMinutes();
        this.attempts = Caffeine.newBuilder()
                .expireAfterWrite(props.auth().loginLockDuration().toNanos(), TimeUnit.NANOSECONDS)
                .maximumSize(MAX_TRACKED_EMAILS)
                .ticker(ticker)
                .build();
    }

    /** Ném 429 nếu email đang bị khóa; nếu không thì tính một lượt thử. */
    public void beginAttempt(String email) {
        Integer used = attempts.getIfPresent(email);
        if (used != null && used >= maxFailures + 1) {
            throw locked();
        }
        int now = attempts.asMap().merge(email, 1, Integer::sum);
        if (now > maxFailures) {
            throw locked();
        }
    }

    /** Đăng nhập đúng (hoặc chủ email vừa đặt lại mật khẩu bằng OTP) thì xóa bộ đếm. */
    public void reset(String email) {
        attempts.invalidate(email);
    }

    private BusinessException locked() {
        return new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "LOGIN_LOCKED",
                "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau " + lockMinutes + " phút.");
    }
}
