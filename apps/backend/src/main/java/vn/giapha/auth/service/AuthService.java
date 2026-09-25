package vn.giapha.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.dto.AuthResponse;
import vn.giapha.auth.dto.EmailRequest;
import vn.giapha.auth.dto.GoogleLoginRequest;
import vn.giapha.auth.dto.LoginRequest;
import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.dto.OtpSentResponse;
import vn.giapha.auth.dto.RegisterRequest;
import vn.giapha.auth.dto.ResetPasswordRequest;
import vn.giapha.auth.dto.VerifyOtpRequest;
import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.OtpPurpose;
import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.google.GoogleIdTokenVerifier;
import vn.giapha.auth.google.GoogleIdentity;
import vn.giapha.auth.mapper.UserAccountMapper;
import vn.giapha.auth.repository.EmailOtpRepository;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.common.consent.ConsentService;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.security.JwtService;
import vn.giapha.common.security.RateLimiter;
import vn.giapha.common.security.RateLimiter.Policy;
import vn.giapha.config.AppProperties;

/** Đăng ký, OTP, đăng nhập (mật khẩu và Google), refresh, quên mật khẩu (IDEA §6.1, DECISIONS #15–21). */
@Service
public class AuthService {

    /** Kết quả đăng nhập: body trả JSON và refresh token thô để controller đặt vào cookie. */
    public record AuthResult(AuthResponse body, String refreshToken) {
    }

    /** BCrypt chỉ dùng 72 byte đầu; Spring từ chối mật khẩu dài hơn nên chặn ở đây bằng lỗi trường. */
    private static final int BCRYPT_MAX_BYTES = 72;

    private final UserAccountRepository users;
    private final EmailOtpRepository otps;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokens;
    private final LoginAttemptService loginAttempts;
    private final GoogleIdTokenVerifier googleVerifier;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RateLimiter rateLimiter;
    private final UserAccountMapper mapper;
    private final ConsentService consents;
    private final RootAdminService rootAdmin;
    private final Clock clock;
    private final Policy loginPerIpPolicy;
    /** Băm một mật khẩu giả khi email không tồn tại để thời gian phản hồi không lộ email nào có thật. */
    private final String dummyHash;

    AuthService(UserAccountRepository users, EmailOtpRepository otps, OtpService otpService,
            RefreshTokenService refreshTokens, LoginAttemptService loginAttempts,
            GoogleIdTokenVerifier googleVerifier, PasswordEncoder passwordEncoder, JwtService jwtService,
            RateLimiter rateLimiter, UserAccountMapper mapper, ConsentService consents, RootAdminService rootAdmin,
            Clock clock, AppProperties props) {
        this.users = users;
        this.otps = otps;
        this.otpService = otpService;
        this.refreshTokens = refreshTokens;
        this.loginAttempts = loginAttempts;
        this.googleVerifier = googleVerifier;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
        this.mapper = mapper;
        this.consents = consents;
        this.rootAdmin = rootAdmin;
        this.clock = clock;
        this.loginPerIpPolicy = new Policy("login-ip", props.auth().loginPerMinutePerIp(),
                Duration.ofMinutes(1));
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    // ---------- Đăng ký + OTP ----------

    /** Tạo (hoặc làm mới) tài khoản PENDING rồi gửi OTP. Email đã có tài khoản chính thức thì báo lỗi ở trường email. */
    @Transactional
    public OtpSentResponse register(RegisterRequest req, String clientIp) {
        String email = normalize(req.email());
        requireMatchingPasswords(req.password(), req.confirmPassword(), "confirmPassword");
        requirePasswordFitsBcrypt(req.password(), "password");
        otpService.checkIpAllowed(clientIp);

        UserAccount user = users.findByEmail(email).orElse(null);
        if (user != null && user.getStatus() != AccountStatus.PENDING) {
            throw emailTaken();
        }
        // Hạn mức theo email chỉ áp dụng khi thật sự sắp gửi OTP
        otpService.checkEmailAllowed(email, OtpPurpose.REGISTER);
        String hash = passwordEncoder.encode(req.password());
        if (user == null) {
            user = new UserAccount(email, req.fullName().trim(), AccountStatus.PENDING, Instant.now(clock));
        } else {
            // Tài khoản chưa xác thực: người đăng ký lại được đặt lại tên và mật khẩu
            user.setFullName(req.fullName().trim());
        }
        user.setPasswordHash(hash);
        try {
            users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw emailTaken();
        }
        // Đồng ý chính sách nằm ngay trong form đăng ký (DECISIONS #57), nên lưu cùng lúc với tài khoản
        consents.recordIfMissing(user.getId(), clientIp);
        otpService.issue(email, OtpPurpose.REGISTER);
        return otpSent(email);
    }

    /** Gửi lại OTP đăng ký. Không cho biết email có tồn tại hay không. */
    @Transactional
    public OtpSentResponse resendRegisterOtp(EmailRequest req, String clientIp) {
        String email = normalize(req.email());
        otpService.checkSendAllowed(email, OtpPurpose.REGISTER, clientIp);
        users.findByEmail(email)
                .filter(u -> u.getStatus() == AccountStatus.PENDING)
                .ifPresent(u -> otpService.issue(email, OtpPurpose.REGISTER));
        return otpSent(email);
    }

    /** OTP đúng thì tài khoản chuyển ACTIVE và đăng nhập luôn. */
    @Transactional(noRollbackFor = BusinessException.class)
    public AuthResult verifyRegisterOtp(VerifyOtpRequest req) {
        String email = normalize(req.email());
        otpService.check(email, OtpPurpose.REGISTER, req.otp(), true);
        UserAccount user = users.findByEmail(email)
                .filter(u -> u.getStatus() == AccountStatus.PENDING)
                .orElseThrow(() -> new BusinessException("OTP_EXPIRED",
                        "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã."));
        user.setStatus(AccountStatus.ACTIVE);
        return authenticated(rootAdmin.promoteIfRoot(user));
    }

    // ---------- Đăng nhập ----------

    /** Sai email hay sai mật khẩu đều chỉ báo lỗi chung (IDEA §6.1). */
    public AuthResult login(LoginRequest req, String clientIp) {
        String email = normalize(req.email());
        rateLimiter.acquireOrThrow(loginPerIpPolicy, clientIp, "RATE_LIMITED",
                "Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây.");
        loginAttempts.beginAttempt(email);

        UserAccount user = users.findByEmail(email).orElse(null);
        String hash = user != null && user.getPasswordHash() != null ? user.getPasswordHash() : dummyHash;
        boolean matches = passwordEncoder.matches(req.password(), hash);
        if (user == null || user.getPasswordHash() == null || !matches) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                    "Email hoặc mật khẩu không đúng.");
        }
        // Đến đây mật khẩu đã đúng nên báo trạng thái tài khoản không làm lộ gì cho người dò email
        if (user.getStatus() == AccountStatus.PENDING) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
                    "Email chưa được xác thực. Vui lòng nhập mã OTP đã gửi tới email của bạn.");
        }
        if (user.getStatus() == AccountStatus.LOCKED) {
            throw accountLocked();
        }
        loginAttempts.reset(email);
        return authenticated(rootAdmin.promoteIfRoot(user));
    }

    /** Đăng nhập bằng Google ID token; tự liên kết theo email (DECISIONS #16). */
    @Transactional
    public AuthResult loginWithGoogle(GoogleLoginRequest req) {
        GoogleIdentity identity = googleVerifier.verify(req.idToken());
        if (!identity.emailVerified()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "GOOGLE_EMAIL_UNVERIFIED",
                    "Email Google chưa được xác thực.");
        }
        String email = normalize(identity.email());
        if (!StandardCharsets.US_ASCII.newEncoder().canEncode(email)) {
            // Cột email chỉ nhận ASCII; địa chỉ có dấu/IDN có thể "trông giống" email của người khác
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "GOOGLE_TOKEN_INVALID",
                    "Không xác minh được tài khoản Google. Vui lòng thử lại.");
        }
        UserAccount user = users.findByGoogleSub(identity.sub()).orElse(null);
        if (user == null) {
            user = users.findByEmail(email).orElse(null);
            if (user == null) {
                user = createFromGoogle(identity, email);
            } else {
                linkGoogle(user, identity, email);
            }
        }
        if (user.getStatus() == AccountStatus.LOCKED) {
            throw accountLocked();
        }
        return authenticated(rootAdmin.promoteIfRoot(user));
    }

    // ---------- Refresh, đăng xuất, thông tin cá nhân ----------

    public AuthResult refresh(String rawRefreshToken) {
        RefreshTokenService.Rotated rotated = refreshTokens.rotate(rawRefreshToken);
        return new AuthResult(authResponse(rotated.user()), rotated.newToken());
    }

    public void logout(String rawRefreshToken) {
        refreshTokens.revoke(rawRefreshToken);
    }

    @Transactional(readOnly = true)
    public MeResponse me(Long userId) {
        UserAccount user = users.findById(userId)
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                        "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
        return toMe(user);
    }

    /** Lưu lần đồng ý chính sách hiện hành (Google lần đầu, hoặc khi đổi phiên bản); đã đồng ý rồi thì không ghi thêm. */
    @Transactional
    public MeResponse acceptConsent(Long userId, String clientIp) {
        UserAccount user = users.findById(userId)
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                        "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
        consents.recordIfMissing(user.getId(), clientIp);
        return toMe(user);
    }

    // ---------- Quên mật khẩu ----------

    /** Luôn trả cùng một phản hồi, dù email có tài khoản hay không. */
    @Transactional
    public OtpSentResponse forgotPassword(EmailRequest req, String clientIp) {
        String email = normalize(req.email());
        otpService.checkSendAllowed(email, OtpPurpose.RESET, clientIp);
        users.findByEmail(email)
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .ifPresent(u -> otpService.issue(email, OtpPurpose.RESET));
        return otpSent(email);
    }

    /** Kiểm tra OTP đặt lại mật khẩu mà chưa dùng hết mã, để FE chuyển sang bước nhập mật khẩu mới. */
    @Transactional(noRollbackFor = BusinessException.class)
    public void verifyResetOtp(VerifyOtpRequest req) {
        otpService.check(normalize(req.email()), OtpPurpose.RESET, req.otp(), false);
    }

    /** Đặt mật khẩu mới rồi thu hồi mọi refresh token, buộc đăng nhập lại ở mọi thiết bị. */
    @Transactional(noRollbackFor = BusinessException.class)
    public void resetPassword(ResetPasswordRequest req) {
        String email = normalize(req.email());
        requireMatchingPasswords(req.newPassword(), req.confirmPassword(), "confirmPassword");
        requirePasswordFitsBcrypt(req.newPassword(), "newPassword");
        otpService.check(email, OtpPurpose.RESET, req.otp(), true);
        UserAccount user = users.findByEmail(email)
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException("OTP_EXPIRED",
                        "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã."));
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        refreshTokens.revokeAll(user.getId());
        // Chủ email vừa chứng minh quyền sở hữu bằng OTP nên gỡ luôn khóa đăng nhập tạm
        loginAttempts.reset(email);
    }

    // ---------- Job dọn dẹp ----------

    /** Xóa tài khoản PENDING quá hạn giữ (7 ngày), OTP và refresh token hết hạn. */
    @Transactional
    public int purgeExpired(Instant now, Duration pendingRetention) {
        Instant cutoff = now.minus(pendingRetention);
        otps.deleteOfPendingAccountsCreatedBefore(cutoff);
        int deleted = users.deletePendingCreatedBefore(cutoff);
        otps.deleteExpiredBefore(now);
        refreshTokens.purgeExpired();
        return deleted;
    }

    // ---------- Nội bộ ----------

    private UserAccount createFromGoogle(GoogleIdentity identity, String email) {
        String name = identity.name() != null && !identity.name().isBlank()
                ? identity.name().trim()
                : email.substring(0, email.indexOf('@'));
        UserAccount user = new UserAccount(email, truncate(name, 100), AccountStatus.ACTIVE, Instant.now(clock));
        user.setGoogleSub(identity.sub());
        user.setAvatarUrl(truncate(identity.picture(), 500));
        try {
            return users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Hai request Google song song cho cùng người dùng mới: lấy bản đã được tạo
            return users.findByGoogleSub(identity.sub()).orElseThrow(() -> e);
        }
    }

    private void linkGoogle(UserAccount user, GoogleIdentity identity, String email) {
        if (user.getGoogleSub() != null && !user.getGoogleSub().equals(identity.sub())) {
            throw new BusinessException(HttpStatus.CONFLICT, "GOOGLE_ACCOUNT_MISMATCH",
                    "Email này đã liên kết với một tài khoản Google khác.");
        }
        if (user.getStatus() == AccountStatus.PENDING) {
            // Mật khẩu do người chưa chứng minh sở hữu email đặt ra: bỏ đi để họ không chiếm được tài khoản
            // sau khi chủ email thật đăng nhập bằng Google.
            user.setPasswordHash(null);
            user.setStatus(AccountStatus.ACTIVE);
            otps.deleteByEmailAndPurpose(email, OtpPurpose.REGISTER);
        }
        user.setGoogleSub(identity.sub());
        if (user.getAvatarUrl() == null) {
            user.setAvatarUrl(truncate(identity.picture(), 500));
        }
    }

    private AuthResult authenticated(UserAccount user) {
        return new AuthResult(authResponse(user), refreshTokens.issue(user.getId()));
    }

    private AuthResponse authResponse(UserAccount user) {
        CurrentUser claims = new CurrentUser(user.getId(), user.getSystemRole().name(),
                user.getApprovalStatus().name(), user.getFamilyId(),
                user.getFamilyRole() == null ? null : user.getFamilyRole().name(), user.getMemberId());
        return AuthResponse.bearer(jwtService.createAccessToken(claims), jwtService.accessTtlSeconds(), toMe(user));
    }

    private MeResponse toMe(UserAccount user) {
        return mapper.toMe(user, !consents.hasAcceptedCurrentPolicy(user.getId()));
    }

    private OtpSentResponse otpSent(String email) {
        return new OtpSentResponse(email, otpService.expiresInSeconds(), otpService.resendAfterSeconds());
    }

    private static BusinessException emailTaken() {
        return new BusinessException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED",
                "Email này đã được đăng ký.", List.of(new FieldError("email", "Email này đã được đăng ký.")));
    }

    private static BusinessException accountLocked() {
        return new BusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED",
                "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    private static void requireMatchingPasswords(String password, String confirm, String confirmField) {
        if (!password.equals(confirm)) {
            throw validation(confirmField, "Mật khẩu nhập lại không khớp.");
        }
    }

    private static void requirePasswordFitsBcrypt(String password, String field) {
        if (password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw validation(field, "Mật khẩu quá dài (tối đa 72 byte, ký tự có dấu chiếm nhiều byte hơn).");
        }
    }

    private static BusinessException validation(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.",
                List.of(new FieldError(field, message)));
    }

    static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
