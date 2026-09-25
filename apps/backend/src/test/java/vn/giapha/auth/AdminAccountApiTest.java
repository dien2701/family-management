package vn.giapha.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.giapha.support.AccountFixtures;
import vn.giapha.support.AccountFixtures.Session;
import vn.giapha.support.IntegrationTest;
import vn.giapha.support.RecordingMailSender;

/**
 * {@code /api/admin/accounts} (Đợt 8; IDEA §3, §6.10; DECISIONS #55–56, #74): phân quyền, duyệt, từ chối, khóa,
 * cấp/gỡ Admin, chặn tự thao tác, Admin cuối cùng, thu hồi refresh token và audit log.
 */
@IntegrationTest
@AutoConfigureMockMvc
class AdminAccountApiTest {

    private static final List<String> FORBIDDEN_FRAGMENTS = List.of(
            "passwordHash", "password_hash", "googleSub", "google_sub", "tokenHash", "token_hash", "$2a$", "$2b$");
    private static final String CALENDAR = "/api/calendar/convert?solar=2026-02-17";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired RecordingMailSender mail;

    AccountFixtures accounts;

    @BeforeEach
    void setUp() {
        accounts = new AccountFixtures(mvc, jdbc, mail);
    }

    // ---------- Phân quyền ----------

    @Test
    void onlyAdminsCanCallAccountApi() throws Exception {
        Session user = accounts.approved();
        Session waiting = accounts.waiting();
        Session admin = accounts.admin();

        // Chưa đăng nhập
        mvc.perform(get("/api/admin/accounts")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/accounts/1/approve")).andExpect(status().isUnauthorized());

        // User đã duyệt: 403 FORBIDDEN cho mọi endpoint
        for (String action : List.of("approve", "reject", "lock", "unlock", "grant-admin", "revoke-admin")) {
            act(user, waiting.id(), action).andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }
        mvc.perform(get("/api/admin/accounts").header(HttpHeaders.AUTHORIZATION, user.bearer()))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));

        // Tài khoản chưa duyệt: bị cổng duyệt chặn trước
        mvc.perform(get("/api/admin/accounts").header(HttpHeaders.AUTHORIZATION, waiting.bearer()))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));
        act(waiting, user.id(), "approve").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));

        // Không có gì bị đổi
        assertThat(approvalOf(waiting.id())).isEqualTo("WAITING");
        act(admin, waiting.id(), "approve").andExpect(status().isOk());
    }

    @Test
    void adminRoleIsCheckedFromDatabaseNotFromStaleClaim() throws Exception {
        Session stale = accounts.admin();
        Session target = accounts.waiting();
        // Bị gỡ quyền nhưng token cũ còn claim ADMIN tới 15 phút
        jdbc.update("UPDATE user_account SET system_role = 'USER' WHERE id = ?", stale.id());

        act(stale, target.id(), "approve").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(get("/api/admin/accounts").header(HttpHeaders.AUTHORIZATION, stale.bearer()))
                .andExpect(status().isForbidden());
        assertThat(approvalOf(target.id())).isEqualTo("WAITING");
    }

    // ---------- Danh sách ----------

    @Test
    void listFiltersByApprovalStatusRoleAndText() throws Exception {
        Session admin = accounts.admin();
        String m = AccountFixtures.marker();
        Session waiting = accounts.waiting(m + "-a@example.com", "Nguyễn Thị " + m);
        Session approved = accounts.approved(m + "-b@example.com", "Trần Văn " + m);
        Session locked = accounts.approved(m + "-c@example.com", "Lê Quốc " + m);
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE id = ?", locked.id());
        // Chưa xác thực OTP thì chưa phải tài khoản thật: không hiện ở danh sách
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"Chưa Xác Thực %s","email":"%s-d@example.com","password":"%s","confirmPassword":"%s",
                 "acceptTerms":true}""".formatted(m, m, AccountFixtures.PASSWORD, AccountFixtures.PASSWORD)))
                .andExpect(status().isOk());

        MvcResult all = list(admin, "q=" + m).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andReturn();
        assertNoSecrets(all);
        // Mới nhất trước
        assertThat(ids(all)).containsExactly(locked.id(), approved.id(), waiting.id());

        assertThat(ids(list(admin, "approval=WAITING&q=" + m).andReturn())).containsExactly(waiting.id());
        assertThat(ids(list(admin, "approval=APPROVED&q=" + m).andReturn()))
                .containsExactly(locked.id(), approved.id());
        assertThat(ids(list(admin, "status=LOCKED&q=" + m).andReturn())).containsExactly(locked.id());
        assertThat(ids(list(admin, "status=ACTIVE&approval=APPROVED&q=" + m).andReturn()))
                .containsExactly(approved.id());
        assertThat(ids(list(admin, "role=ADMIN&q=" + m).andReturn())).isEmpty();
        assertThat(ids(list(admin, "role=USER&q=" + m).andReturn())).hasSize(3);

        // Họ tên: không phân biệt hoa thường và dấu; email: theo mảnh
        assertThat(ids(list(admin, "q=nguyen thi " + m).andReturn())).containsExactly(waiting.id());
        assertThat(ids(list(admin, "q=NGUYỄN THỊ " + m).andReturn())).containsExactly(waiting.id());
        assertThat(ids(list(admin, "q=" + m + "-b@example").andReturn())).containsExactly(approved.id());
        // Ký tự đại diện của LIKE được coi là chữ thường, không khớp mọi thứ
        assertThat(ids(list(admin, "q=%" + m).andReturn())).isEmpty();
        assertThat(ids(list(admin, "q=" + m + "_a").andReturn())).isEmpty();
    }

    @Test
    void listIsPaged() throws Exception {
        Session admin = accounts.admin();
        String m = AccountFixtures.marker();
        for (int i = 0; i < 5; i++) {
            accounts.waiting(m + "-" + i + "@example.com", "Phân Trang " + m);
        }

        list(admin, "q=" + m + "&size=2&page=0").andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5)).andExpect(jsonPath("$.totalPages").value(3));
        list(admin, "q=" + m + "&size=2&page=2").andExpect(jsonPath("$.items.length()").value(1));
        list(admin, "q=" + m + "&size=2&page=3").andExpect(jsonPath("$.items.length()").value(0));

        list(admin, "size=0").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        list(admin, "size=101").andExpect(status().isBadRequest());
        list(admin, "page=-1").andExpect(status().isBadRequest());
        list(admin, "approval=BAO_LA").andExpect(status().isBadRequest());
    }

    // ---------- Duyệt, từ chối ----------

    @Test
    void approveLetsTheAccountIntoTheAppAfterRefresh() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.waiting();
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, b.bearer())).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));

        MvcResult approved = act(admin, b.id(), "approve").andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.id()))
                .andExpect(jsonPath("$.email").value(b.email()))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"))
                .andExpect(jsonPath("$.approvedBy").value(admin.id()))
                .andExpect(jsonPath("$.approvedAt").isNotEmpty())
                .andExpect(jsonPath("$.systemRole").value("USER"))
                .andReturn();
        assertNoSecrets(approved);

        Session fresh = accounts.refreshed(b);
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, fresh.bearer())).andExpect(status().isOk());
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, fresh.bearer()))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));

        // Đã duyệt rồi thì không duyệt lại
        act(admin, b.id(), "approve").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));
    }

    @Test
    void rejectRevokesSessionsAndAccountCanBeApprovedAgain() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.waiting();

        act(admin, b.id(), "reject").andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("REJECTED"))
                .andExpect(jsonPath("$.approvedBy").doesNotExist())
                .andExpect(jsonPath("$.approvedAt").doesNotExist());
        // Refresh token bị thu hồi
        accounts.refresh(b).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        // Vẫn đăng nhập được để thấy trang "không được duyệt", nhưng không dùng được API
        Session again = accounts.login(b.email());
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, again.bearer()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.approvalStatus").value("REJECTED"));
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, again.bearer())).andExpect(status().isForbidden());
        // Từ chối hai lần: sai trạng thái
        act(admin, b.id(), "reject").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));

        // Admin duyệt lại một tài khoản đã bị từ chối (IDEA §5)
        act(admin, b.id(), "approve").andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
        Session ok = accounts.login(b.email());
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, ok.bearer())).andExpect(status().isOk());
    }

    @Test
    void rejectingAnApprovedAccountCutsItOffImmediately() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.approved();

        act(admin, b.id(), "reject").andExpect(status().isOk());

        accounts.refresh(b).andExpect(status().isUnauthorized());
        // Token cũ còn claim APPROVED nhưng thao tác ghi đọc DB nên bị chặn ngay
        mvc.perform(post("/api/family").header(HttpHeaders.AUTHORIZATION, b.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Họ Thử\",\"acceptPolicy\":true}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));
    }

    // ---------- Khóa ----------

    @Test
    void lockRevokesSessionsBlocksLoginAndUnlockRestoresIt() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.approved();

        act(admin, b.id(), "lock").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOCKED")).andExpect(jsonPath("$.lockReason").value("MANUAL"))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
        accounts.refresh(b).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(b.email(), AccountFixtures.PASSWORD)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        // Token cũ: ghi bị chặn ngay
        mvc.perform(post("/api/family").header(HttpHeaders.AUTHORIZATION, b.bearer())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Họ Thử\",\"acceptPolicy\":true}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        // Đã khóa thì không khóa lại
        act(admin, b.id(), "lock").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));

        act(admin, b.id(), "unlock").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE")).andExpect(jsonPath("$.lockReason").doesNotExist());
        Session back = accounts.login(b.email());
        mvc.perform(get(CALENDAR).header(HttpHeaders.AUTHORIZATION, back.bearer())).andExpect(status().isOk());
        // Không đang bị khóa thì không mở khóa
        act(admin, b.id(), "unlock").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));
    }

    // ---------- Quyền Admin ----------

    @Test
    void grantAndRevokeAdminFlow() throws Exception {
        Session a = accounts.admin();
        accounts.onlyAdmins(a.id());
        Session b = accounts.approved();
        Session waiting = accounts.waiting();

        // Chỉ cấp cho tài khoản đã duyệt
        act(a, waiting.id(), "grant-admin").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));
        act(a, b.id(), "grant-admin").andExpect(status().isOk())
                .andExpect(jsonPath("$.systemRole").value("ADMIN"));
        // Cấp cho người đã là Admin: sai trạng thái
        act(a, b.id(), "grant-admin").andExpect(status().isConflict());
        // Refresh token của B bị thu hồi để claim mới có hiệu lực
        accounts.refresh(b).andExpect(status().isUnauthorized());
        Session bAdmin = accounts.login(b.email());

        // A tự gỡ quyền của chính mình: bị chặn
        act(a, a.id(), "revoke-admin").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SELF_ACTION_FORBIDDEN"));
        assertThat(roleOf(a.id())).isEqualTo("ADMIN");

        // B (Admin mới) gỡ quyền của A: thành công, và A không còn dùng được API quản trị dù token còn hạn
        act(bAdmin, a.id(), "revoke-admin").andExpect(status().isOk())
                .andExpect(jsonPath("$.systemRole").value("USER"));
        accounts.refresh(a).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/accounts").header(HttpHeaders.AUTHORIZATION, a.bearer()))
                .andExpect(status().isForbidden());
        // Gỡ quyền người không phải Admin
        act(bAdmin, a.id(), "revoke-admin").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_ACCOUNT_STATE"));

        // B là Admin duy nhất: tự gỡ quyền bị chặn
        act(bAdmin, bAdmin.id(), "revoke-admin").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SELF_ACTION_FORBIDDEN"));
        assertThat(roleOf(bAdmin.id())).isEqualTo("ADMIN");
        assertThat(count("SELECT COUNT(*) FROM user_account WHERE system_role = 'ADMIN'")).isEqualTo(1);
    }

    @Test
    void adminCannotActOnThemselves() throws Exception {
        Session a = accounts.admin();
        Session b = accounts.admin();
        accounts.onlyAdmins(a.id(), b.id());

        for (String action : List.of("reject", "lock", "revoke-admin")) {
            act(a, a.id(), action).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("SELF_ACTION_FORBIDDEN"));
        }
        assertThat(roleOf(a.id())).isEqualTo("ADMIN");
        assertThat(statusOf(a.id())).isEqualTo("ACTIVE");
        assertThat(approvalOf(a.id())).isEqualTo("APPROVED");
    }

    @Test
    void adminCanLockAndRejectAnotherAdminWhileOneStaysActive() throws Exception {
        Session a = accounts.admin();
        Session b = accounts.admin();
        Session c = accounts.admin();
        accounts.onlyAdmins(a.id(), b.id(), c.id());

        act(a, b.id(), "lock").andExpect(status().isOk());
        act(a, c.id(), "reject").andExpect(status().isOk());
        // Còn một mình A là Admin hoạt động, và B/C (đã bị khóa/từ chối) không làm được gì
        act(b, a.id(), "lock").andExpect(status().isForbidden());
        act(c, a.id(), "lock").andExpect(status().isForbidden());
        assertThat(statusOf(a.id())).isEqualTo("ACTIVE");
    }

    @Test
    void twoAdminsRemovingEachOtherNeverLeavesZeroAdmins() throws Exception {
        for (String action : List.of("revoke-admin", "lock", "reject")) {
            Session a = accounts.admin();
            Session b = accounts.admin();
            accounts.onlyAdmins(a.id(), b.id());

            CountDownLatch start = new CountDownLatch(1);
            List<Integer> codes = new ArrayList<>();
            try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
                Future<Integer> ab = pool.submit(call(start, a, b.id(), action));
                Future<Integer> ba = pool.submit(call(start, b, a.id(), action));
                start.countDown();
                codes.add(ab.get());
                codes.add(ba.get());
            }

            // Hai request chạy tuần tự: cái đầu thành công; cái sau do người gọi đã mất quyền nên bị từ chối
            assertThat(codes).as(action).containsExactlyInAnyOrder(200, 403);
            assertThat(count("SELECT COUNT(*) FROM user_account WHERE system_role = 'ADMIN' AND status = 'ACTIVE' "
                    + "AND approval_status = 'APPROVED'")).as(action).isEqualTo(1);
        }
    }

    // ---------- Không tìm thấy, audit ----------

    @Test
    void unknownAndUnverifiedAccountsAreNotFound() throws Exception {
        Session admin = accounts.admin();
        String email = AccountFixtures.newEmail();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"Chưa Xác Thực","email":"%s","password":"%s","confirmPassword":"%s","acceptTerms":true}"""
                .formatted(email, AccountFixtures.PASSWORD, AccountFixtures.PASSWORD))).andExpect(status().isOk());
        long pendingId = jdbc.queryForObject("SELECT id FROM user_account WHERE email = ?", Long.class, email);

        act(admin, 999_999_999L, "approve").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
        act(admin, pendingId, "approve").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
        assertThat(approvalOf(pendingId)).isEqualTo("WAITING");
    }

    @Test
    void everyChangeIsWrittenToAuditLogWithoutPersonalData() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.waiting();

        act(admin, b.id(), "approve").andExpect(status().isOk());
        act(admin, b.id(), "lock").andExpect(status().isOk());
        act(admin, b.id(), "unlock").andExpect(status().isOk());
        act(admin, b.id(), "grant-admin").andExpect(status().isOk());
        act(admin, b.id(), "revoke-admin").andExpect(status().isOk());
        act(admin, b.id(), "reject").andExpect(status().isOk());

        List<String> actions = jdbc.queryForList("SELECT action FROM audit_log WHERE target_type = 'ACCOUNT' "
                + "AND target_id = ? AND actor_id = ? AND family_id IS NULL ORDER BY id", String.class, b.id(),
                admin.id());
        assertThat(actions).containsExactly("APPROVE", "LOCK", "UNLOCK", "GRANT_ADMIN", "REVOKE_ADMIN", "REJECT");

        String before = jdbc.queryForObject("SELECT before_data FROM audit_log WHERE target_id = ? AND action = 'APPROVE'",
                String.class, b.id());
        String after = jdbc.queryForObject("SELECT after_data FROM audit_log WHERE target_id = ? AND action = 'APPROVE'",
                String.class, b.id());
        assertThat(JsonPath.<String>read(before, "$.approvalStatus")).isEqualTo("WAITING");
        assertThat(JsonPath.<String>read(after, "$.approvalStatus")).isEqualTo("APPROVED");
        assertThat(before + after).doesNotContain(b.email()).doesNotContain("@");
    }

    @Test
    void failedChangeWritesNothing() throws Exception {
        Session admin = accounts.admin();
        Session b = accounts.approved();
        long before = count("SELECT COUNT(*) FROM audit_log WHERE target_type = 'ACCOUNT' AND target_id = ?", b.id());

        act(admin, b.id(), "approve").andExpect(status().isConflict());

        assertThat(count("SELECT COUNT(*) FROM audit_log WHERE target_type = 'ACCOUNT' AND target_id = ?", b.id()))
                .isEqualTo(before);
    }

    // ---------- Helper ----------

    private ResultActions act(Session actor, long targetId, String action) throws Exception {
        return mvc.perform(post("/api/admin/accounts/" + targetId + "/" + action)
                .header(HttpHeaders.AUTHORIZATION, actor.bearer()));
    }

    private Callable<Integer> call(CountDownLatch start, Session actor, long targetId, String action) {
        return () -> {
            start.await();
            return act(actor, targetId, action).andReturn().getResponse().getStatus();
        };
    }

    /** {@code query} dạng {@code a=1&b=2}, giá trị để nguyên (không mã hóa URL) để thử cả ký tự đặc biệt. */
    private ResultActions list(Session admin, String query) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/admin/accounts")
                .header(HttpHeaders.AUTHORIZATION, admin.bearer());
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            request.param(pair.substring(0, eq), pair.substring(eq + 1));
        }
        return mvc.perform(request);
    }

    private static List<Long> ids(MvcResult result) throws Exception {
        List<Number> raw = JsonPath.read(result.getResponse().getContentAsString(), "$.items[*].id");
        return raw.stream().map(Number::longValue).toList();
    }

    private String roleOf(long id) {
        return jdbc.queryForObject("SELECT system_role FROM user_account WHERE id = ?", String.class, id);
    }

    private String statusOf(long id) {
        return jdbc.queryForObject("SELECT status FROM user_account WHERE id = ?", String.class, id);
    }

    private String approvalOf(long id) {
        return jdbc.queryForObject("SELECT approval_status FROM user_account WHERE id = ?", String.class, id);
    }

    private long count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Long.class, args);
    }

    /** Response không bao giờ chứa hash, google_sub hay bí mật khác (security.md). */
    private static void assertNoSecrets(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            assertThat(body).as("response không được chứa %s", fragment).doesNotContain(fragment);
        }
    }
}
