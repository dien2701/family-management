package vn.giapha.auth.service;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.giapha.config.AppProperties;

/** Mỗi ngày lúc 03:30 giờ Việt Nam: xóa tài khoản PENDING quá 7 ngày (DECISIONS #20) và dọn OTP, token hết hạn. */
@Component
class AccountCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(AccountCleanupJob.class);

    private final AuthService authService;
    private final AppProperties props;
    private final Clock clock;

    AccountCleanupJob(AuthService authService, AppProperties props, Clock clock) {
        this.authService = authService;
        this.props = props;
        this.clock = clock;
    }

    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        int deleted = authService.purgeExpired(Instant.now(clock), props.auth().pendingRetention());
        log.info("Đã xóa {} tài khoản PENDING quá hạn", deleted);
    }
}
