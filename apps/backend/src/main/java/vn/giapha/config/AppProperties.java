package vn.giapha.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;

/** Mục {@code app.*} của YAML. Giá trị mặc định khớp IDEA §6.1 và DECISIONS #17–20. */
@ConfigurationProperties("app")
public record AppProperties(
        @DefaultValue Jwt jwt,
        @DefaultValue Auth auth,
        @DefaultValue Google google,
        @DefaultValue Mail mail,
        @DefaultValue Policy policy,
        @DefaultValue File file,
        // Email của Admin gốc (DECISIONS #55); rỗng nghĩa là không có Admin gốc
        @DefaultValue("") String rootAdminEmail) {

    /** Phiên bản chính sách bảo mật; đổi khi nội dung chính sách đổi để biết ai đã đồng ý bản nào. */
    public record Policy(@DefaultValue("1.0") String version) {
    }

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

    /** Cloudinary và giới hạn tệp (IDEA §6.7, DECISIONS #67). Khóa rỗng nghĩa là chưa cấu hình: sign/confirm trả 503. */
    public record File(
            @DefaultValue("") String cloudName,
            @DefaultValue("") String apiKey,
            @DefaultValue("") String apiSecret,
            @DefaultValue("10MB") DataSize maxFileSize,
            @DefaultValue("1GB") DataSize totalLimit,
            // Link tải tệp cần chữ ký hết hạn sau khoảng này
            @DefaultValue("5m") Duration downloadTtl) {
    }

    public record Google(@DefaultValue("") String clientId) {
    }

    public record Mail(@DefaultValue("no-reply@giapha.local") String from) {
    }
}
