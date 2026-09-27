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
        @DefaultValue Mail mail,
        @DefaultValue File file,
        @DefaultValue Push push,
        @DefaultValue Ai ai,
        // Email của Admin gốc (DECISIONS #55); rỗng nghĩa là không có Admin gốc
        @DefaultValue("") String rootAdminEmail) {

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

    /**
     * Cloudinary (IDEA §6.7, DECISIONS #67). Khóa rỗng nghĩa là chưa cấu hình: sign/confirm trả 503. Giới hạn dung
     * lượng tệp và tổng dung lượng đọc từ {@code system_setting} (module admin, Đợt 32), không cấu hình tĩnh ở đây.
     */
    public record File(
            @DefaultValue("") String cloudName,
            @DefaultValue("") String apiKey,
            @DefaultValue("") String apiSecret,
            // Link tải tệp cần chữ ký hết hạn sau khoảng này
            @DefaultValue("5m") Duration downloadTtl) {
    }

    public record Google(@DefaultValue("") String clientId) {
    }

    public record Mail(@DefaultValue("no-reply@giapha.local") String from) {
    }

    /** VAPID cho Web Push (IDEA §9, DECISIONS #46). Khóa rỗng nghĩa là chưa cấu hình: API push trả 503. */
    public record Push(
            @DefaultValue("") String vapidPublicKey,
            @DefaultValue("") String vapidPrivateKey,
            @DefaultValue("mailto:admin@example.com") String vapidSubject) {
    }

    /** Gemini (IDEA §10, DECISIONS #47). Khóa rỗng nghĩa là chưa cấu hình: {@code GeminiProvider} trả 503. */
    public record Ai(
            @DefaultValue("") String geminiApiKey,
            @DefaultValue("gemini-2.5-flash") String model) {
    }
}
