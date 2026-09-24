package vn.giapha.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Mục {@code app.*} của YAML. Giá trị mặc định khớp IDEA §6.1 và DECISIONS #17–20. */
@ConfigurationProperties("app")
public record AppProperties(
        @DefaultValue Jwt jwt,
        @DefaultValue Auth auth,
        @DefaultValue Google google,
        @DefaultValue Mail mail) {

    public record Jwt(String secret, @DefaultValue("15m") Duration accessTtl) {
    }

    public record Auth(
            @DefaultValue("30d") Duration refreshTtl,
            // Cookie refresh luôn Secure; chỉ tắt được khi cần thử qua http không phải localhost
            @DefaultValue("true") boolean cookieSecure,
            @DefaultValue("10m") Duration otpTtl,
            @DefaultValue("60s") Duration otpResendInterval,
            @DefaultValue("5") int otpMaxAttempts,
            @DefaultValue("5") int otpHourlyLimit,
            @DefaultValue("20") int otpHourlyLimitPerIp,
            @DefaultValue("5") int loginMaxFailures,
            @DefaultValue("15m") Duration loginLockDuration,
            @DefaultValue("30") int loginPerMinutePerIp,
            @DefaultValue("7d") Duration pendingRetention) {
    }

    public record Google(@DefaultValue("") String clientId) {
    }

    public record Mail(@DefaultValue("no-reply@giapha.local") String from) {
    }
}
