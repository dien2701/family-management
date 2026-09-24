package vn.giapha.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.entity.EmailOtp;
import vn.giapha.auth.entity.OtpPurpose;
import vn.giapha.auth.mail.MailSender;
import vn.giapha.auth.repository.EmailOtpRepository;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.common.security.RateLimiter;
import vn.giapha.common.security.RateLimiter.Policy;
import vn.giapha.config.AppProperties;

/**
 * OTP 6 số qua email. Chỉ lưu HMAC-SHA256 (khóa dẫn xuất từ JWT_SECRET) vì không gian 10^6 mã quá nhỏ
 * để dùng hash trần: lộ DB cũng không dò ngược được. Hiệu lực 10 phút, tối đa 5 lần thử, gửi lại sau 60 giây.
 */
@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String HMAC = "HmacSHA256";

    private final EmailOtpRepository repository;
    private final MailSender mailSender;
    private final RateLimiter rateLimiter;
    private final AppProperties props;
    private final Clock clock;
    private final SecretKeySpec hmacKey;

    private final Policy cooldownPolicy;
    private final Policy hourlyPolicy;
    private final Policy hourlyPerIpPolicy;

    OtpService(EmailOtpRepository repository, MailSender mailSender, RateLimiter rateLimiter, AppProperties props,
            Clock clock, SecretKey jwtSecretKey) {
        this.repository = repository;
        this.mailSender = mailSender;
        this.rateLimiter = rateLimiter;
        this.props = props;
        this.clock = clock;
        // Khóa riêng cho OTP, tách khỏi khóa ký JWT
        this.hmacKey = new SecretKeySpec(hmac(jwtSecretKey.getEncoded(), "otp-v1".getBytes(StandardCharsets.UTF_8)),
                HMAC);
        AppProperties.Auth auth = props.auth();
        this.cooldownPolicy = new Policy("otp-cooldown", 1, auth.otpResendInterval());
        this.hourlyPolicy = new Policy("otp-hourly", auth.otpHourlyLimit(), Duration.ofHours(1));
        this.hourlyPerIpPolicy = new Policy("otp-hourly-ip", auth.otpHourlyLimitPerIp(), Duration.ofHours(1));
    }

    /**
     * Kiểm tra hạn mức gửi OTP theo IP và theo email. Khóa chỉ gồm IP/email (không phụ thuộc tài khoản có tồn tại
     * hay không) nên phản hồi 429 không làm lộ email.
     */
    public void checkSendAllowed(String email, OtpPurpose purpose, String clientIp) {
        checkIpAllowed(clientIp);
        checkEmailAllowed(email, purpose);
    }

    public void checkIpAllowed(String clientIp) {
        rateLimiter.acquireOrThrow(hourlyPerIpPolicy, clientIp, "OTP_RATE_LIMITED",
                "Bạn yêu cầu mã quá nhiều lần. Vui lòng thử lại sau {seconds} giây.");
    }

    public void checkEmailAllowed(String email, OtpPurpose purpose) {
        String key = purpose + ":" + email;
        rateLimiter.acquireOrThrow(cooldownPolicy, key, "OTP_RATE_LIMITED",
                "Vui lòng đợi {seconds} giây trước khi yêu cầu mã mới.");
        rateLimiter.acquireOrThrow(hourlyPolicy, key, "OTP_RATE_LIMITED",
                "Bạn yêu cầu mã quá nhiều lần. Vui lòng thử lại sau {seconds} giây.");
    }

    /** Tạo OTP mới (mã cũ của cùng email và mục đích bị hủy) rồi gửi email. Gọi trong transaction của nơi gọi. */
    @Transactional
    public void issue(String email, OtpPurpose purpose) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant now = Instant.now(clock);
        repository.deleteByEmailAndPurpose(email, purpose);
        repository.save(new EmailOtp(email, purpose, hash(email, purpose, code),
                now.plus(props.auth().otpTtl()), now));
        long minutes = props.auth().otpTtl().toMinutes();
        String subject = purpose == OtpPurpose.REGISTER
                ? "Mã xác thực đăng ký Gia Phả"
                : "Mã đặt lại mật khẩu Gia Phả";
        mailSender.send(email, subject, "Mã xác thực của bạn là: " + code + "\n\n"
                + "Mã có hiệu lực trong " + minutes + " phút. Không chia sẻ mã này với bất kỳ ai.\n"
                + "Nếu bạn không yêu cầu, hãy bỏ qua email này.");
    }

    /**
     * Kiểm tra mã. Mỗi lần gọi tốn một lượt thử (kể cả khi đúng), nên chuỗi verify rồi reset dùng 2 trong 5 lượt.
     * Sai thì vẫn phải ghi lượt thử, vì vậy không rollback khi ném {@link BusinessException}.
     *
     * @param consume xóa OTP khi đúng (dùng một lần)
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public void check(String email, OtpPurpose purpose, String code, boolean consume) {
        EmailOtp otp = repository.findFirstByEmailAndPurposeOrderByIdDesc(email, purpose).orElse(null);
        if (otp == null || !otp.getExpiresAt().isAfter(Instant.now(clock))) {
            throw new BusinessException("OTP_EXPIRED",
                    "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã.");
        }
        int max = props.auth().otpMaxAttempts();
        if (repository.claimAttempt(otp.getId(), max) == 0) {
            throw new BusinessException("OTP_ATTEMPTS_EXCEEDED",
                    "Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi lại mã mới.");
        }
        if (!MessageDigest.isEqual(hash(email, purpose, code).getBytes(StandardCharsets.UTF_8),
                otp.getCodeHash().getBytes(StandardCharsets.UTF_8))) {
            int remaining = Math.max(0, max - otp.getAttempts() - 1);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "OTP_INVALID",
                    "Mã xác thực không đúng. Còn " + remaining + " lần thử.",
                    List.of(new FieldError("otp", "Mã xác thực không đúng.")));
        }
        if (consume && repository.deleteOne(otp.getId()) == 0) {
            throw new BusinessException("OTP_EXPIRED",
                    "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã.");
        }
    }

    public long expiresInSeconds() {
        return props.auth().otpTtl().toSeconds();
    }

    public long resendAfterSeconds() {
        return props.auth().otpResendInterval().toSeconds();
    }

    private String hash(String email, OtpPurpose purpose, String code) {
        Mac mac = newMac(hmacKey);
        return HexFormat.of().formatHex(
                mac.doFinal((purpose + ":" + email + ":" + code).getBytes(StandardCharsets.UTF_8)));
    }

    private static byte[] hmac(byte[] key, byte[] data) {
        return newMac(new SecretKeySpec(key, HMAC)).doFinal(data);
    }

    private static Mac newMac(SecretKeySpec key) {
        try {
            Mac mac = Mac.getInstance(HMAC);
            mac.init(key);
            return mac;
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
