package vn.giapha.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.jayway.jsonpath.JsonPath;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import vn.giapha.auth.google.GoogleIdTokenVerifier;
import vn.giapha.auth.google.GoogleIdentity;
import vn.giapha.auth.service.AuthService;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.util.Hashing;
import vn.giapha.config.AppProperties;
import vn.giapha.support.IntegrationTest;
import vn.giapha.support.RecordingMailSender;

/** Luồng Auth đầy đủ trên Spring context thật + MySQL 8.4. Mỗi test dùng email riêng nên không dọn dữ liệu. */
@IntegrationTest
@AutoConfigureMockMvc
class AuthApiTest {

    private static final String PASSWORD = "matkhau-manh-1";
    private static final String COOKIE = "refresh_token";
    private static final List<String> FORBIDDEN_FRAGMENTS = List.of(
            "passwordHash", "password_hash", "googleSub", "google_sub", "tokenHash", "token_hash",
            "codeHash", "code_hash", "$2a$", "$2b$");

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired RecordingMailSender mail;
    @Autowired JwtDecoder jwtDecoder;
    @Autowired JwtEncoder jwtEncoder;
    @Autowired AuthService authService;
    @Autowired AppProperties props;

    @MockitoBean GoogleIdTokenVerifier googleVerifier;

    // ---------- Đăng ký + OTP ----------

    @Test
    void registerThenVerifyOtpActivatesAndLogsIn() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.expiresInSeconds").value(600))
                .andExpect(jsonPath("$.resendAfterSeconds").value(60));
        assertThat(statusOf(email)).isEqualTo("PENDING");

        MvcResult result = verifyOtp(email, mail.lastOtp(email)).andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andReturn();

        assertThat(statusOf(email)).isEqualTo("ACTIVE");
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).startsWith(COOKIE + "=")
                .contains("HttpOnly").contains("Secure").contains("SameSite=Strict").contains("Path=/api/auth");
        assertNoSecrets(result);

        // OTP dùng một lần
        verifyOtp(email, mail.lastOtp(email)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_EXPIRED"));

        MvcResult me = mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(result)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.systemRole").value("USER"))
                .andExpect(jsonPath("$.approvalStatus").value("WAITING"))
                .andExpect(jsonPath("$.consentRequired").value(false))
                .andExpect(jsonPath("$.familyId").doesNotExist())
                .andReturn();
        assertNoSecrets(me);
        // Đăng ký email lưu consent ngay, không gắn dòng họ (DECISIONS #57)
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NULL "
                + "AND policy_version = ? AND ip IS NOT NULL", Integer.class, userId(email),
                props.policy().version())).isEqualTo(1);
    }

    @Test
    void accessTokenCarriesExpectedClaims() throws Exception {
        String email = activeUser();
        MvcResult login = login(email, PASSWORD).andExpect(status().isOk()).andReturn();

        Jwt jwt = jwtDecoder.decode(token(login));
        assertThat(jwt.getSubject()).isEqualTo(String.valueOf(userId(email)));
        assertThat(jwt.getClaimAsString("sysRole")).isEqualTo("USER");
        assertThat(jwt.getClaimAsString("approval")).isEqualTo("WAITING");
        assertThat(jwt.getClaims()).doesNotContainKeys("familyId", "familyRole", "memberId");
        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofMinutes(15));
        assertThat(jwt.getHeaders().get("alg")).isEqualTo("HS256");

        // Sau khi có family, claim mới xuất hiện ở lần refresh kế tiếp
        jdbc.update("INSERT INTO family (name, created_by, created_at) VALUES ('Họ Test', ?, NOW(6))", userId(email));
        long familyId = jdbc.queryForObject("SELECT MAX(id) FROM family", Long.class);
        jdbc.update("UPDATE user_account SET family_id = ?, family_role = 'MANAGER', member_id = 7 WHERE email = ?",
                familyId, email);
        MvcResult refreshed = refresh(cookie(login)).andExpect(status().isOk()).andReturn();
        Jwt after = jwtDecoder.decode(token(refreshed));
        assertThat(after.getClaimAsString("familyRole")).isEqualTo("MANAGER");
        assertThat(((Number) after.getClaim("familyId")).longValue()).isEqualTo(familyId);
        assertThat(((Number) after.getClaim("memberId")).longValue()).isEqualTo(7L);
    }

    @Test
    void registerValidationShowsErrorsPerField() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field=='fullName')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='email')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='acceptTerms')]").exists());

        register(newEmail(), "Nguyễn Văn A", PASSWORD, "khac-hoan-toan", true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='confirmPassword')]").exists());

        register(newEmail(), "Nguyễn Văn A", "ngan", "ngan", true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists());

        // 30 chữ "ệ" = 90 byte UTF-8, vượt giới hạn 72 byte của BCrypt dù chỉ 30 ký tự
        String longAccents = "ệ".repeat(30);
        register(newEmail(), "Nguyễn Văn A", longAccents, longAccents, true)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='password')]").exists());
    }

    @Test
    void registerWithActiveEmailReportsErrorOnEmailField() throws Exception {
        String email = activeUser();
        register(email).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_REGISTERED"))
                .andExpect(jsonPath("$.errors[0].field").value("email"));
    }

    @Test
    void registeringAgainWithinCooldownIsRateLimitedInsteadOfDuplicating() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());

        register(email, "Tên mới", "mat-khau-moi-1", "mat-khau-moi-1", true)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("OTP_RATE_LIMITED"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_account WHERE email = ?", Integer.class, email))
                .isEqualTo(1);
        assertThat(mail.mailsTo(email)).hasSize(1);
    }

    @Test
    void otpWrongFiveTimesLocksTheCode() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());
        String good = mail.lastOtp(email);
        String bad = good.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            verifyOtp(email, bad).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("OTP_INVALID"))
                    .andExpect(jsonPath("$.errors[0].field").value("otp"));
        }
        // Lần thứ 6 bị từ chối kể cả khi mã đúng
        verifyOtp(email, good).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_ATTEMPTS_EXCEEDED"));
        assertThat(statusOf(email)).isEqualTo("PENDING");
    }

    @Test
    void expiredOtpIsRejected() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());
        jdbc.update("UPDATE email_otp SET expires_at = ? WHERE email = ?",
                java.sql.Timestamp.from(Instant.now().minusSeconds(1)), email);

        verifyOtp(email, mail.lastOtp(email)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_EXPIRED"));
    }

    @Test
    void otpCanNotBeResentWithin60Seconds() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());

        postJson("/api/auth/resend-otp", "{\"email\":\"" + email + "\"}")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("OTP_RATE_LIMITED"));
        assertThat(mail.mailsTo(email)).hasSize(1);
    }

    @Test
    void otpIsStoredAsHashOnly() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());
        String otp = mail.lastOtp(email);

        String stored = jdbc.queryForObject("SELECT code_hash FROM email_otp WHERE email = ?", String.class, email);
        assertThat(stored).hasSize(64).isNotEqualTo(otp).doesNotContain(otp);
    }

    // ---------- Đăng nhập + khóa ----------

    @Test
    void loginFailuresGiveTheSameGenericErrorForUnknownAndKnownEmail() throws Exception {
        String email = activeUser();
        String known = login(email, "sai-mat-khau-1").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS")).andReturn()
                .getResponse().getContentAsString();
        String unknown = login(newEmail(), "sai-mat-khau-1").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS")).andReturn()
                .getResponse().getContentAsString();

        assertThat(JsonPath.<String>read(known, "$.detail")).isEqualTo(JsonPath.<String>read(unknown, "$.detail"));
    }

    @Test
    void loginWithOverlongPasswordIsAnOrdinaryFailureNotAServerError() throws Exception {
        String email = activeUser();
        login(email, "x".repeat(150)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        login(newEmail(), "x".repeat(150)).andExpect(status().isUnauthorized());
    }

    @Test
    void pendingAccountCanNotLoginEvenWithCorrectPassword() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());

        login(email, PASSWORD).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void fiveWrongPasswordsLockLoginEvenForCorrectPassword() throws Exception {
        String email = activeUser();
        for (int i = 0; i < 5; i++) {
            login(email, "sai-mat-khau-1").andExpect(status().isUnauthorized());
        }
        login(email, PASSWORD).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("LOGIN_LOCKED"));

        // Email không tồn tại cũng bị khóa y hệt, nên không dùng được để dò email
        String ghost = newEmail();
        for (int i = 0; i < 5; i++) {
            login(ghost, "sai-mat-khau-1").andExpect(status().isUnauthorized());
        }
        login(ghost, "sai-mat-khau-1").andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("LOGIN_LOCKED"));
    }

    @Test
    void successfulLoginResetsTheFailureCounter() throws Exception {
        String email = activeUser();
        for (int i = 0; i < 4; i++) {
            login(email, "sai-mat-khau-1").andExpect(status().isUnauthorized());
        }
        login(email, PASSWORD).andExpect(status().isOk());
        for (int i = 0; i < 4; i++) {
            login(email, "sai-mat-khau-1").andExpect(status().isUnauthorized());
        }
        login(email, PASSWORD).andExpect(status().isOk());
    }

    @Test
    void lockedAccountCanNotLoginOrRefresh() throws Exception {
        String email = activeUser();
        MvcResult login = login(email, PASSWORD).andExpect(status().isOk()).andReturn();

        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE email = ?", email);

        login(email, PASSWORD).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        refresh(cookie(login)).andExpect(status().isUnauthorized());
    }

    // ---------- Refresh token ----------

    @Test
    void refreshRotatesTokenAndRejectsTheOldOne() throws Exception {
        String email = activeUser();
        MvcResult login = login(email, PASSWORD).andExpect(status().isOk()).andReturn();
        String first = cookie(login);

        MvcResult second = refresh(first).andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty()).andReturn();
        String rotated = cookie(second);
        assertThat(rotated).isNotEqualTo(first);
        assertThat(second.getResponse().getHeader(HttpHeaders.SET_COOKIE))
                .contains("HttpOnly").contains("Secure").contains("SameSite=Strict").contains("Path=/api/auth");
        assertNoSecrets(second);

        refresh(first).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        refresh(rotated).andExpect(status().isOk());
    }

    @Test
    void refreshTokenIsStoredAsSha256Only() throws Exception {
        String email = activeUser();
        String raw = cookie(login(email, PASSWORD).andExpect(status().isOk()).andReturn());

        Integer plain = jdbc.queryForObject("SELECT COUNT(*) FROM refresh_token WHERE token_hash = ?",
                Integer.class, raw);
        Integer hashed = jdbc.queryForObject("SELECT COUNT(*) FROM refresh_token WHERE token_hash = ?",
                Integer.class, Hashing.sha256Hex(raw));
        assertThat(plain).isZero();
        assertThat(hashed).isEqualTo(1);
    }

    @Test
    void refreshWithoutOrWithUnknownCookieIsRejected() throws Exception {
        mvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        refresh("khong-ton-tai").andExpect(status().isUnauthorized());
    }

    @Test
    void expiredRefreshTokenIsRejected() throws Exception {
        String email = activeUser();
        String raw = cookie(login(email, PASSWORD).andExpect(status().isOk()).andReturn());
        jdbc.update("UPDATE refresh_token SET expires_at = ? WHERE token_hash = ?",
                java.sql.Timestamp.from(Instant.now().minusSeconds(1)), Hashing.sha256Hex(raw));

        refresh(raw).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshTokenAndClearsCookie() throws Exception {
        String email = activeUser();
        String raw = cookie(login(email, PASSWORD).andExpect(status().isOk()).andReturn());

        MvcResult out = mvc.perform(post("/api/auth/logout").cookie(new Cookie(COOKIE, raw)))
                .andExpect(status().isNoContent()).andReturn();
        assertThat(out.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("Max-Age=0").contains("Path=/api/auth");

        refresh(raw).andExpect(status().isUnauthorized());
    }

    // ---------- /api/me và bảo vệ endpoint ----------

    @Test
    void protectedEndpointRejectsMissingOrInvalidTokenWithProblemDetail() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.errors").isArray());
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer rac.rac.rac"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

        // Token đúng chữ ký nhưng đã hết hạn
        Instant past = Instant.now().minus(Duration.ofHours(1));
        JwtClaimsSet claims = JwtClaimsSet.builder().subject("1").issuedAt(past.minusSeconds(900))
                .expiresAt(past).claim("sysRole", "USER").build();
        String expired = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Quên mật khẩu ----------

    @Test
    void forgotPasswordDoesNotRevealWhetherEmailExists() throws Exception {
        String known = activeUser();
        String unknown = newEmail();

        String a = postJson("/api/auth/forgot-password", "{\"email\":\"" + known + "\"}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String b = postJson("/api/auth/forgot-password", "{\"email\":\"" + unknown + "\"}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertThat(JsonPath.<Integer>read(a, "$.expiresInSeconds")).isEqualTo(JsonPath.<Integer>read(b, "$.expiresInSeconds"));
        assertThat(mail.mailsTo(unknown)).isEmpty();
        assertThat(mail.mailsTo(known)).hasSize(2); // OTP đăng ký + OTP đặt lại
    }

    @Test
    void resetPasswordRevokesEveryRefreshTokenAndChangesPassword() throws Exception {
        String email = activeUser();
        String oldCookie = cookie(login(email, PASSWORD).andExpect(status().isOk()).andReturn());
        String otherDevice = cookie(login(email, PASSWORD).andExpect(status().isOk()).andReturn());

        postJson("/api/auth/forgot-password", "{\"email\":\"" + email + "\"}").andExpect(status().isOk());
        String otp = mail.lastOtp(email);

        postJson("/api/auth/verify-reset-otp", "{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}")
                .andExpect(status().isNoContent());
        // Mật khẩu nhập lại không khớp thì chưa đổi gì và chưa tiêu OTP
        postJson("/api/auth/reset-password", resetJson(email, otp, "mat-khau-moi-2", "khac-nhau-hoan-toan"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='confirmPassword')]").exists());
        postJson("/api/auth/reset-password", resetJson(email, otp, "mat-khau-moi-2", "mat-khau-moi-2"))
                .andExpect(status().isNoContent());

        refresh(oldCookie).andExpect(status().isUnauthorized());
        refresh(otherDevice).andExpect(status().isUnauthorized());
        login(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, "mat-khau-moi-2").andExpect(status().isOk());

        // OTP chỉ dùng một lần
        postJson("/api/auth/reset-password", resetJson(email, otp, "mat-khau-moi-3", "mat-khau-moi-3"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_EXPIRED"));
    }

    @Test
    void resetPasswordWithWrongOtpFailsAndCountsAttempts() throws Exception {
        String email = activeUser();
        postJson("/api/auth/forgot-password", "{\"email\":\"" + email + "\"}").andExpect(status().isOk());
        String good = mail.lastOtp(email);
        String bad = good.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            postJson("/api/auth/reset-password", resetJson(email, bad, "mat-khau-moi-2", "mat-khau-moi-2"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_INVALID"));
        }
        postJson("/api/auth/reset-password", resetJson(email, good, "mat-khau-moi-2", "mat-khau-moi-2"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_ATTEMPTS_EXCEEDED"));
        login(email, PASSWORD).andExpect(status().isOk());
    }

    @Test
    void resetPasswordClearsLoginLock() throws Exception {
        String email = activeUser();
        for (int i = 0; i < 5; i++) {
            login(email, "sai-mat-khau-1").andExpect(status().isUnauthorized());
        }
        login(email, PASSWORD).andExpect(status().isTooManyRequests());

        postJson("/api/auth/forgot-password", "{\"email\":\"" + email + "\"}").andExpect(status().isOk());
        postJson("/api/auth/reset-password", resetJson(email, mail.lastOtp(email), "mat-khau-moi-2", "mat-khau-moi-2"))
                .andExpect(status().isNoContent());

        login(email, "mat-khau-moi-2").andExpect(status().isOk());
    }

    // ---------- Google ----------

    @Test
    void googleLoginCreatesActiveAccountForNewEmail() throws Exception {
        String email = newEmail();
        when(googleVerifier.verify("token-moi")).thenReturn(
                new GoogleIdentity("sub-" + UUID.randomUUID(), email, true, "Trần Thị B", "https://example.com/a.png"));

        MvcResult result = postJson("/api/auth/google", "{\"idToken\":\"token-moi\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.fullName").value("Trần Thị B"))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andReturn();
        assertThat(result.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("HttpOnly");
        assertNoSecrets(result);
        assertThat(jdbc.queryForObject("SELECT password_hash FROM user_account WHERE email = ?", String.class, email))
                .isNull();
    }

    @Test
    void googleLoginLinksExistingPasswordAccountByEmail() throws Exception {
        String email = activeUser();
        String sub = "sub-" + UUID.randomUUID();
        when(googleVerifier.verify("token-lien-ket")).thenReturn(new GoogleIdentity(sub, email, true, "Tên khác", null));

        postJson("/api/auth/google", "{\"idToken\":\"token-lien-ket\"}").andExpect(status().isOk());

        assertThat(jdbc.queryForObject("SELECT google_sub FROM user_account WHERE email = ?", String.class, email))
                .isEqualTo(sub);
        // Vẫn đăng nhập được bằng mật khẩu cũ, và lần Google sau khớp theo sub
        login(email, PASSWORD).andExpect(status().isOk());
        postJson("/api/auth/google", "{\"idToken\":\"token-lien-ket\"}").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_account WHERE email = ?", Integer.class, email))
                .isEqualTo(1);
    }

    @Test
    void googleLoginActivatesPendingAccountAndDropsThePasswordSetBySomeoneElse() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());
        when(googleVerifier.verify("token-pending")).thenReturn(
                new GoogleIdentity("sub-" + UUID.randomUUID(), email, true, "Chủ email thật", null));

        postJson("/api/auth/google", "{\"idToken\":\"token-pending\"}").andExpect(status().isOk());

        assertThat(statusOf(email)).isEqualTo("ACTIVE");
        // Mật khẩu do người đăng ký ban đầu đặt bị bỏ, tránh chiếm tài khoản của chủ email thật
        assertThat(jdbc.queryForObject("SELECT password_hash FROM user_account WHERE email = ?", String.class, email))
                .isNull();
        login(email, PASSWORD).andExpect(status().isUnauthorized());
        // OTP đăng ký còn lại không dùng được nữa
        verifyOtp(email, mail.lastOtp(email)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_EXPIRED"));
    }

    @Test
    void googleLoginRejectsUnverifiedEmailAndInvalidToken() throws Exception {
        when(googleVerifier.verify("chua-xac-thuc")).thenReturn(
                new GoogleIdentity("sub-x", newEmail(), false, "X", null));
        postJson("/api/auth/google", "{\"idToken\":\"chua-xac-thuc\"}").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("GOOGLE_EMAIL_UNVERIFIED"));

        when(googleVerifier.verify("token-sai")).thenThrow(new BusinessException(HttpStatus.UNAUTHORIZED,
                "GOOGLE_TOKEN_INVALID", "Không xác minh được tài khoản Google. Vui lòng thử lại."));
        postJson("/api/auth/google", "{\"idToken\":\"token-sai\"}").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("GOOGLE_TOKEN_INVALID"));

        postJson("/api/auth/google", "{}").andExpect(status().isBadRequest());
    }

    @Test
    void googleLoginRejectsLockedAccountAndDifferentGoogleSub() throws Exception {
        String locked = activeUser();
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE email = ?", locked);
        when(googleVerifier.verify("token-khoa")).thenReturn(new GoogleIdentity("sub-khoa", locked, true, "K", null));
        postJson("/api/auth/google", "{\"idToken\":\"token-khoa\"}").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));

        String linked = activeUser();
        jdbc.update("UPDATE user_account SET google_sub = 'sub-goc' WHERE email = ?", linked);
        when(googleVerifier.verify("token-khac")).thenReturn(new GoogleIdentity("sub-khac", linked, true, "K", null));
        postJson("/api/auth/google", "{\"idToken\":\"token-khac\"}").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("GOOGLE_ACCOUNT_MISMATCH"));
    }

    // ---------- Email giả mạo bằng ký tự có dấu / IDN (security-review) ----------

    @Test
    void lookAlikeEmailsWithAccentsCanNotReachAnotherAccount() throws Exception {
        String victim = "alice-" + UUID.randomUUID().toString().substring(0, 8) + "@gmail.com";
        register(victim).andExpect(status().isOk());
        verifyOtp(victim, mail.lastOtp(victim)).andExpect(status().isOk());
        String lookAlike = victim.replace("gmail", "gmaíl").replace("alice", "alicé");

        for (String bad : new String[] {lookAlike, victim.replace("gmail", "gmaíl")}) {
            postJson("/api/auth/forgot-password", "{\"email\":\"" + bad + "\"}").andExpect(status().isBadRequest());
            postJson("/api/auth/reset-password", resetJson(bad, "123456", "mat-khau-moi-2", "mat-khau-moi-2"))
                    .andExpect(status().isBadRequest());
            postJson("/api/auth/resend-otp", "{\"email\":\"" + bad + "\"}").andExpect(status().isBadRequest());
            login(bad, PASSWORD).andExpect(status().isBadRequest());
            register(bad).andExpect(status().isBadRequest());
        }
        assertThat(mail.mailsTo(victim.replace("gmail", "gmaíl"))).isEmpty();
        // Google: email có dấu bị từ chối trước khi tra cứu
        when(googleVerifier.verify("token-idn")).thenReturn(
                new GoogleIdentity("sub-idn", victim.replace("gmail", "gmaíl"), true, "X", null));
        postJson("/api/auth/google", "{\"idToken\":\"token-idn\"}").andExpect(status().isUnauthorized());
        login(victim, PASSWORD).andExpect(status().isOk());
    }

    @Test
    void emailColumnsCompareExactlyWithoutFoldingAccents() {
        String collation = jdbc.queryForObject("""
                SELECT COLLATION_NAME FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'user_account' AND column_name = 'email'""",
                String.class);
        assertThat(collation).isEqualTo("ascii_bin");
    }

    // ---------- Job dọn dẹp ----------

    @Test
    void purgeDeletesPendingAccountsOlderThanSevenDaysOnly() throws Exception {
        String old = newEmail();
        String recent = newEmail();
        String activeOld = activeUser();
        register(old).andExpect(status().isOk());
        register(recent).andExpect(status().isOk());
        jdbc.update("UPDATE user_account SET created_at = ? WHERE email IN (?, ?)",
                java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(8))), old, activeOld);

        authService.purgeExpired(Instant.now(), props.auth().pendingRetention());

        assertThat(exists(old)).isFalse();
        assertThat(exists(recent)).isTrue();
        assertThat(exists(activeOld)).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM email_otp WHERE email = ?", Integer.class, old)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM email_otp WHERE email = ?", Integer.class, recent))
                .isEqualTo(1);
    }

    // ---------- Helper ----------

    private String activeUser() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isOk());
        verifyOtp(email, mail.lastOtp(email)).andExpect(status().isOk());
        return email;
    }

    private static String newEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    private ResultActions register(String email) throws Exception {
        return register(email, "Nguyễn Văn A", PASSWORD, PASSWORD, true);
    }

    private ResultActions register(String email, String name, String password, String confirm, boolean terms)
            throws Exception {
        return postJson("/api/auth/register", """
                {"fullName":"%s","email":"%s","password":"%s","confirmPassword":"%s","acceptTerms":%s}"""
                .formatted(name, email, password, confirm, terms));
    }

    private ResultActions verifyOtp(String email, String otp) throws Exception {
        return postJson("/api/auth/verify-otp", "{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}");
    }

    private ResultActions login(String email, String password) throws Exception {
        return postJson("/api/auth/login", "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
    }

    private ResultActions refresh(String rawCookie) throws Exception {
        return mvc.perform(post("/api/auth/refresh").cookie(new Cookie(COOKIE, rawCookie)));
    }

    private ResultActions postJson(String url, String json) throws Exception {
        return mvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static String resetJson(String email, String otp, String password, String confirm) {
        return "{\"email\":\"%s\",\"otp\":\"%s\",\"newPassword\":\"%s\",\"confirmPassword\":\"%s\"}"
                .formatted(email, otp, password, confirm);
    }

    private static String token(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private static String bearer(MvcResult result) throws Exception {
        return "Bearer " + token(result);
    }

    /** Giá trị refresh token thô trong header Set-Cookie. */
    private static String cookie(MvcResult result) {
        String header = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(header).startsWith(COOKIE + "=");
        return header.substring((COOKIE + "=").length(), header.indexOf(';'));
    }

    private String statusOf(String email) {
        return jdbc.queryForObject("SELECT status FROM user_account WHERE email = ?", String.class, email);
    }

    private long userId(String email) {
        return jdbc.queryForObject("SELECT id FROM user_account WHERE email = ?", Long.class, email);
    }

    private boolean exists(String email) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM user_account WHERE email = ?", Integer.class, email) > 0;
    }

    /** Response không bao giờ chứa hash, google_sub hay bí mật khác (security.md). */
    private static void assertNoSecrets(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            assertThat(body).as("response không được chứa %s", fragment).doesNotContain(fragment);
        }
    }
}
