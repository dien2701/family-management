package vn.giapha.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import vn.giapha.auth.google.GoogleIdTokenVerifier;
import vn.giapha.auth.google.GoogleIdentity;
import vn.giapha.auth.service.AuthService;
import vn.giapha.config.AppProperties;
import vn.giapha.support.AccountFixtures;
import vn.giapha.support.AccountFixtures.Session;
import vn.giapha.support.IntegrationTest;
import vn.giapha.support.RecordingMailSender;

/**
 * Admin gốc, cổng duyệt tài khoản và consent (Đợt 8; DECISIONS #55–57, #74) trên Spring context thật + MySQL 8.4.
 * Email Admin gốc là {@code root.admin@giapha.test} (application-test.yml); mỗi test tự dọn trạng thái Admin.
 */
@IntegrationTest
@AutoConfigureMockMvc
class AccountApprovalApiTest {

    private static final String ROOT_EMAIL = "root.admin@giapha.test";
    private static final String CALENDAR = "/api/calendar/convert?solar=2026-02-17";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired RecordingMailSender mail;
    @Autowired JwtDecoder jwtDecoder;
    @Autowired JwtEncoder jwtEncoder;
    @Autowired AuthService authService;
    @Autowired AppProperties props;
    @Autowired PasswordEncoder passwordEncoder;

    @MockitoBean GoogleIdTokenVerifier googleVerifier;

    AccountFixtures accounts;

    @BeforeEach
    void setUp() {
        accounts = new AccountFixtures(mvc, jdbc, mail);
        // Xóa tài khoản Admin gốc của lần chạy trước (kéo theo consent, refresh token) và mọi Admin còn sót
        jdbc.update("DELETE FROM user_account WHERE email = ?", ROOT_EMAIL);
        accounts.onlyAdmins();
    }

    // ---------- Admin gốc ----------

    @Test
    void rootEmailBecomesApprovedAdminWhenVerifyingOtpAndNoAdminExists() throws Exception {
        MvcResult verified = registerAndVerify(ROOT_EMAIL);

        assertThat(verified.getResponse().getContentAsString()).contains("\"systemRole\":\"ADMIN\"");
        Jwt jwt = jwtDecoder.decode(JsonPath.read(verified.getResponse().getContentAsString(), "$.accessToken"));
        assertThat(jwt.getClaimAsString("sysRole")).isEqualTo("ADMIN");
        assertThat(jwt.getClaimAsString("approval")).isEqualTo("APPROVED");

        Session root = AccountFixtures.session(ROOT_EMAIL, verified);
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, root.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.systemRole").value("ADMIN"))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
        // Duyệt ngay, không chờ ai; và dùng được API nghiệp vụ, kể cả Admin
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, root.bearer())).andExpect(status().isOk());
        mvc.perform(get("/api/admin/accounts").header(HttpHeaders.AUTHORIZATION, root.bearer()))
                .andExpect(status().isOk());
        assertThat(count("SELECT COUNT(*) FROM audit_log WHERE action = 'ROOT_ADMIN_PROMOTE' AND actor_id = ?",
                root.id())).isEqualTo(1);
    }

    @Test
    void rootEmailIsPromotedOnPasswordLoginToo() throws Exception {
        insertActiveRoot();
        // Đã có Admin khác thì đăng nhập vẫn chỉ là User thường
        Session other = accounts.admin();
        loginRoot().andExpect(status().isOk()).andExpect(jsonPath("$.user.systemRole").value("USER"))
                .andExpect(jsonPath("$.user.approvalStatus").value("WAITING"));
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("USER");

        // Hết Admin rồi mới đăng nhập: được nâng
        accounts.onlyAdmins();
        assertThat(roleOf(other.email())).isEqualTo("USER");
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(ROOT_EMAIL, AccountFixtures.PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.systemRole").value("ADMIN"))
                .andExpect(jsonPath("$.user.approvalStatus").value("APPROVED"));
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("ADMIN");
    }

    @Test
    void rootEmailIsPromotedOnGoogleLogin() throws Exception {
        when(googleVerifier.verify("root-google")).thenReturn(
                new GoogleIdentity("sub-" + UUID.randomUUID(), ROOT_EMAIL, true, "Admin Gốc", null));

        MvcResult result = mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"root-google\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.systemRole").value("ADMIN"))
                .andExpect(jsonPath("$.user.approvalStatus").value("APPROVED"))
                // Vẫn phải tick đồng ý chính sách: Google lần đầu chưa có consent
                .andExpect(jsonPath("$.user.consentRequired").value(true))
                .andReturn();
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("ADMIN");
        assertThat(result.getResponse().getContentAsString()).doesNotContain("googleSub");
    }

    @Test
    void rootEmailIsNotPromotedWhileAnotherAdminExists() throws Exception {
        long rootId = insertActiveRoot();
        accounts.admin();

        MvcResult verified = registerAndVerifyOther();
        loginRoot().andExpect(status().isOk()).andExpect(jsonPath("$.user.systemRole").value("USER"));

        assertThat(verified.getResponse().getContentAsString()).contains("\"systemRole\":\"USER\"");
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("USER");
        assertThat(approvalOf(ROOT_EMAIL)).isEqualTo("WAITING");
        assertThat(count("SELECT COUNT(*) FROM audit_log WHERE action = 'ROOT_ADMIN_PROMOTE' AND actor_id = ?",
                rootId)).isZero();
    }

    @Test
    void lockedOrRejectedAdminsDoNotBlockRootPromotion() throws Exception {
        insertActiveRoot();
        Session locked = accounts.admin();
        Session rejected = accounts.admin();
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE id = ?", locked.id());
        jdbc.update("UPDATE user_account SET approval_status = 'REJECTED' WHERE id = ?", rejected.id());

        // Còn dòng ADMIN nhưng không ai dùng được: Admin gốc vẫn cứu được hệ thống
        loginRoot().andExpect(status().isOk()).andExpect(jsonPath("$.user.systemRole").value("ADMIN"));
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("ADMIN");
    }

    @Test
    void otherEmailsAreNeverPromotedEvenWithoutAnyAdmin() throws Exception {
        Session user = accounts.waiting();

        assertThat(roleOf(user.email())).isEqualTo("USER");
        assertThat(approvalOf(user.email())).isEqualTo("WAITING");
    }

    @Test
    void lockedRootEmailIsNotPromoted() throws Exception {
        insertActiveRoot();
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE email = ?", ROOT_EMAIL);

        loginRoot().andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("USER");
    }

    @Test
    void parallelRequestsPromoteRootExactlyOnce() throws Exception {
        long rootId = insertActiveRoot();

        int threads = 4;
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService pool = Executors.newFixedThreadPool(threads)) {
            List<Future<Integer>> results = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                results.add(pool.submit((Callable<Integer>) () -> {
                    start.await();
                    return loginRoot().andReturn().getResponse().getStatus();
                }));
            }
            start.countDown();
            for (Future<Integer> r : results) {
                assertThat(r.get()).isEqualTo(200);
            }
        }

        assertThat(roleOf(ROOT_EMAIL)).isEqualTo("ADMIN");
        assertThat(count("SELECT COUNT(*) FROM audit_log WHERE action = 'ROOT_ADMIN_PROMOTE' AND actor_id = ?",
                rootId)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM user_account WHERE system_role = 'ADMIN'")).isEqualTo(1);
    }

    // ---------- Cổng duyệt ----------

    @Test
    void writesCheckApprovalAndLockFromDatabaseNotFromStaleClaim() throws Exception {
        Session user = accounts.approved();
        String createMember = "{\"fullName\":\"Người Thử\",\"isDeceased\":false}";

        // Token còn claim APPROVED nhưng Admin vừa từ chối: ghi bị chặn ngay
        jdbc.update("UPDATE user_account SET approval_status = 'REJECTED' WHERE id = ?", user.id());
        notApproved(post("/api/members").header(HttpHeaders.AUTHORIZATION, user.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(createMember));

        // Bị khóa: cũng chặn ngay, mã riêng
        jdbc.update("UPDATE user_account SET approval_status = 'APPROVED', status = 'LOCKED' WHERE id = ?", user.id());
        mvc.perform(post("/api/members").header(HttpHeaders.AUTHORIZATION, user.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(createMember))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));

        // Tài khoản đã bị xóa: coi như chưa đăng nhập
        jdbc.update("DELETE FROM user_account WHERE id = ?", user.id());
        mvc.perform(post("/api/members").header(HttpHeaders.AUTHORIZATION, user.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(createMember))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void approvedAccountIsUnaffectedByTheGate() throws Exception {
        Session user = accounts.approved();

        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, user.bearer())).andExpect(status().isOk());
        mvc.perform(get("/api/members").header(HttpHeaders.AUTHORIZATION, user.bearer())).andExpect(status().isOk());
    }

    // ---------- Consent ----------

    @Test
    void googleFirstLoginNeedsConsentThenStoresItOnce() throws Exception {
        String email = AccountFixtures.newEmail();
        when(googleVerifier.verify("google-moi")).thenReturn(
                new GoogleIdentity("sub-" + UUID.randomUUID(), email, true, "Trần Thị B", null));

        MvcResult login = mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"google-moi\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.approvalStatus").value("WAITING"))
                .andExpect(jsonPath("$.user.consentRequired").value(true))
                .andReturn();
        Session session = AccountFixtures.session(email, login);
        assertThat(consents(session.id())).isZero();

        // Chưa tick thì báo lỗi ở đúng trường
        mvc.perform(consentRequest(session, "{\"acceptTerms\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='acceptTerms')]").exists());
        mvc.perform(consentRequest(session, "{}")).andExpect(status().isBadRequest());
        assertThat(consents(session.id())).isZero();

        mvc.perform(consentRequest(session, "{\"acceptTerms\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consentRequired").value(false))
                .andExpect(jsonPath("$.approvalStatus").value("WAITING"));
        // Phiên bản chính sách nay đọc từ system_setting (Đợt 32), không còn từ AppProperties
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND ip IS NOT NULL",
                Integer.class, session.id())).isEqualTo(1);

        // Gọi lại không ghi thêm
        mvc.perform(consentRequest(session, "{\"acceptTerms\":true}")).andExpect(status().isOk());
        assertThat(consents(session.id())).isEqualTo(1);
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, session.bearer()))
                .andExpect(jsonPath("$.consentRequired").value(false));
        // Đăng nhập Google lần sau không đòi lại
        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"google-moi\"}"))
                .andExpect(jsonPath("$.user.consentRequired").value(false));
    }

    @Test
    void newPolicyVersionAsksEveryoneToConsentAgain() throws Exception {
        Session user = accounts.waiting();
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, user.bearer()))
                .andExpect(jsonPath("$.consentRequired").value(false));

        // Giả lập chính sách đã đổi phiên bản: bản người này đồng ý là bản cũ
        jdbc.update("UPDATE user_consent SET policy_version = '0.1' WHERE user_id = ?", user.id());
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, user.bearer()))
                .andExpect(jsonPath("$.consentRequired").value(true));

        mvc.perform(consentRequest(user, "{\"acceptTerms\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.consentRequired").value(false));
        // Giữ bản cũ để tra lịch sử, thêm bản mới
        assertThat(consents(user.id())).isEqualTo(2);
    }

    @Test
    void emailRegistrationStoresConsentAndPurgingPendingAccountRemovesIt() throws Exception {
        String email = AccountFixtures.newEmail();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"Người Chưa Xác Thực","email":"%s","password":"%s","confirmPassword":"%s",
                 "acceptTerms":true}""".formatted(email, AccountFixtures.PASSWORD, AccountFixtures.PASSWORD)))
                .andExpect(status().isOk());
        long id = jdbc.queryForObject("SELECT id FROM user_account WHERE email = ?", Long.class, email);
        assertThat(consents(id)).isEqualTo(1);

        jdbc.update("UPDATE user_account SET created_at = ? WHERE id = ?",
                java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(8))), id);
        authService.purgeExpired(Instant.now(), props.auth().pendingRetention());

        assertThat(count("SELECT COUNT(*) FROM user_account WHERE id = ?", id)).isZero();
        assertThat(consents(id)).isZero();
    }

    @Test
    void accountsCreatedBeforeApprovalExistedStayWaiting() throws Exception {
        // Cột có DEFAULT 'WAITING' nên dòng chèn không nêu approval_status (như dữ liệu cũ trước V4) là WAITING
        String email = AccountFixtures.newEmail();
        jdbc.update("INSERT INTO user_account (email, full_name, system_role, status, created_at) "
                + "VALUES (?, 'Tài khoản cũ', 'USER', 'ACTIVE', NOW(6))", email);

        assertThat(approvalOf(email)).isEqualTo("WAITING");
        assertThat(jdbc.queryForObject("SELECT approved_by FROM user_account WHERE email = ?", Long.class, email))
                .isNull();
    }

    // ---------- Helper ----------

    /** Tài khoản của email Admin gốc, đã ACTIVE (như sau khi xác thực OTP). Chèn thẳng để khỏi vướng hạn mức OTP theo email. */
    private long insertActiveRoot() {
        jdbc.update("INSERT INTO user_account (email, password_hash, full_name, system_role, status, created_at) "
                + "VALUES (?, ?, 'Người Thử', 'USER', 'ACTIVE', NOW(6))", ROOT_EMAIL,
                passwordEncoder.encode(AccountFixtures.PASSWORD));
        return jdbc.queryForObject("SELECT id FROM user_account WHERE email = ?", Long.class, ROOT_EMAIL);
    }

    private org.springframework.test.web.servlet.ResultActions loginRoot() throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(ROOT_EMAIL, AccountFixtures.PASSWORD)));
    }

    private MvcResult registerAndVerifyOther() throws Exception {
        return registerAndVerify(AccountFixtures.newEmail());
    }

    private MvcResult registerAndVerify(String email) throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"Người Thử","email":"%s","password":"%s","confirmPassword":"%s","acceptTerms":true}"""
                .formatted(email, AccountFixtures.PASSWORD, AccountFixtures.PASSWORD))).andExpect(status().isOk());
        return mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"otp\":\"%s\"}".formatted(email, mail.lastOtp(email))))
                .andExpect(status().isOk()).andReturn();
    }

    private void notApproved(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        mvc.perform(request).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));
    }

    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder consentRequest(
            Session session, String json) {
        return post("/api/me/consent").header(HttpHeaders.AUTHORIZATION, session.bearer())
                .contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private String roleOf(String email) {
        return jdbc.queryForObject("SELECT system_role FROM user_account WHERE email = ?", String.class, email);
    }

    private String approvalOf(String email) {
        return jdbc.queryForObject("SELECT approval_status FROM user_account WHERE email = ?", String.class, email);
    }

    private long consents(long userId) {
        return count("SELECT COUNT(*) FROM user_consent WHERE user_id = ?", userId);
    }

    private long count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Long.class, args);
    }
}
