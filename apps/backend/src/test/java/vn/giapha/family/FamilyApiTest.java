package vn.giapha.family;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.jayway.jsonpath.JsonPath;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import vn.giapha.support.IntegrationTest;
import vn.giapha.support.RecordingMailSender;

/** Luồng family trên Spring context thật + MySQL 8.4: tạo, mã mời, tham gia, rời, loại, chuyển quyền, cách ly. */
@IntegrationTest
@AutoConfigureMockMvc
class FamilyApiTest {

    private static final String PASSWORD = "matkhau-manh-1";
    private static final String COOKIE = "refresh_token";
    private static final List<String> FORBIDDEN_FRAGMENTS = List.of(
            "passwordHash", "password_hash", "googleSub", "google_sub", "tokenHash", "token_hash", "$2a$", "$2b$");

    /** Người dùng thử: token và refresh cookie lấy ngay khi đăng ký, chưa tham gia family nào. */
    private record TestUser(long id, String email, String token, String cookie) {
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired RecordingMailSender mail;
    @Autowired JwtDecoder jwtDecoder;
    @Autowired FamilyFacade facade;

    // ---------- Tạo family ----------

    @Test
    void createFamilyMakesCreatorManagerAndStoresConsent() throws Exception {
        TestUser a = newUser();
        MvcResult created = createFamily(a, "Họ Nguyễn").andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Họ Nguyễn"))
                .andExpect(jsonPath("$.originPlace").value("Nam Định"))
                .andExpect(jsonPath("$.accounts.length()").value(1))
                .andExpect(jsonPath("$.accounts[0].id").value(a.id()))
                .andExpect(jsonPath("$.accounts[0].familyRole").value("MANAGER"))
                .andExpect(jsonPath("$.accounts[0].email").value(a.email()))
                .andReturn();
        assertNoSecrets(created);
        long familyId = familyIdOf(created);

        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.familyId").value(familyId))
                .andExpect(jsonPath("$.familyRole").value("MANAGER"));

        Map<String, Object> consent = jdbc.queryForMap(
                "SELECT policy_version, ip, accepted_at FROM user_consent WHERE user_id = ? AND family_id = ?",
                a.id(), familyId);
        assertThat(consent.get("policy_version")).isEqualTo("1.0");
        assertThat(consent.get("ip")).isEqualTo("127.0.0.1");
        assertThat(consent.get("accepted_at")).isNotNull();

        // Claim mới có ở lần refresh kế tiếp
        MvcResult refreshed = mvc.perform(post("/api/auth/refresh").cookie(new Cookie(COOKIE, a.cookie())))
                .andExpect(status().isOk()).andReturn();
        Jwt jwt = jwtDecoder.decode(JsonPath.read(refreshed.getResponse().getContentAsString(), "$.accessToken"));
        assertThat(jwt.getClaimAsString("familyRole")).isEqualTo("MANAGER");
        assertThat(((Number) jwt.getClaim("familyId")).longValue()).isEqualTo(familyId);
    }

    @Test
    void createFamilyRequiresNameAndConsent() throws Exception {
        TestUser a = newUser();
        postJson("/api/family", a, "{}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field=='name')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='acceptPolicy')]").exists());
        postJson("/api/family", a, "{\"name\":\"Họ Trần\",\"acceptPolicy\":false}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='acceptPolicy')]").exists());
        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", a.id())).isZero();
        assertThat(familyIdInDb(a)).isNull();
    }

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/family")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/family/join").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userAlreadyInFamilyCannotCreateOrJoinAnother() throws Exception {
        TestUser a = newUser();
        createFamily(a, "Họ A").andExpect(status().isCreated());
        TestUser b = newUser();
        createFamily(b, "Họ B").andExpect(status().isCreated());
        String codeOfA = inviteCode(a);

        long consentsBefore = count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", b.id());
        createFamily(b, "Họ B2").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_IN_FAMILY"));
        join(b, codeOfA).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_IN_FAMILY"));

        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", b.id())).isEqualTo(consentsBefore);
        assertThat(count("SELECT COUNT(*) FROM family WHERE created_by = ?", b.id())).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM user_account WHERE family_id = ?", familyIdInDb(a))).isEqualTo(1);
    }

    @Test
    void adminCannotCreateOrJoinFamily() throws Exception {
        TestUser admin = newUser();
        jdbc.update("UPDATE user_account SET system_role = 'ADMIN' WHERE id = ?", admin.id());
        TestUser a = newUser();
        createFamily(a, "Họ A").andExpect(status().isCreated());

        createFamily(admin, "Họ Admin").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ADMIN_CANNOT_HAVE_FAMILY"));
        join(admin, inviteCode(a)).andExpect(status().isForbidden());
        assertThat(familyIdInDb(admin)).isNull();
    }

    // ---------- Mã mời + tham gia ----------

    @Test
    void invitationCodeIsReusableAndJoinGoesStraightIn() throws Exception {
        TestUser a = newUser();
        long familyId = familyIdOf(createFamily(a, "Họ Lê").andReturn());

        MvcResult invite = mvc.perform(post("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn();
        String code = JsonPath.read(invite.getResponse().getContentAsString(), "$.code");
        String link = JsonPath.read(invite.getResponse().getContentAsString(), "$.link");
        assertThat(code).matches("[A-HJKMNP-Z2-9]{8}");
        assertThat(link).endsWith("/moi/" + code);
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT TIMESTAMPDIFF(HOUR, created_at, expires_at) AS hours FROM family_invitation WHERE code = ?",
                code);
        assertThat(((Number) row.get("hours")).intValue()).isEqualTo(7 * 24);

        // Người thứ hai nhập mã viết thường, có khoảng trắng thừa: vẫn vào thẳng family
        TestUser b = newUser();
        MvcResult joined = join(b, "  " + code.toLowerCase() + " ").andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(familyId))
                .andExpect(jsonPath("$.accounts.length()").value(2))
                .andReturn();
        assertNoSecrets(joined);
        assertThat(familyIdInDb(b)).isEqualTo(familyId);
        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id = ? "
                + "AND policy_version = '1.0'", b.id(), familyId)).isEqualTo(1);
        mvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(b)))
                .andExpect(jsonPath("$.familyRole").value("MEMBER"));

        // Mã dùng được nhiều lần
        TestUser c = newUser();
        join(c, code).andExpect(status().isOk()).andExpect(jsonPath("$.accounts.length()").value(3));

        // Danh sách của Manager thấy mã, ở trạng thái còn hiệu lực
        mvc.perform(get("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value(code))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void revokedAndExpiredAndUnknownCodesGiveSeparateErrors() throws Exception {
        TestUser a = newUser();
        createFamily(a, "Họ Phạm").andExpect(status().isCreated());

        MvcResult toRevoke = createInvitation(a);
        long revokeId = ((Number) JsonPath.read(toRevoke.getResponse().getContentAsString(), "$.id")).longValue();
        String revokedCode = JsonPath.read(toRevoke.getResponse().getContentAsString(), "$.code");
        mvc.perform(delete("/api/family/invitations/" + revokeId).header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isNoContent());

        String expiredCode = JsonPath.read(createInvitation(a).getResponse().getContentAsString(), "$.code");
        jdbc.update("UPDATE family_invitation SET expires_at = DATE_SUB(NOW(6), INTERVAL 1 SECOND) WHERE code = ?",
                expiredCode);

        TestUser c = newUser();
        join(c, revokedCode).andExpect(status().isGone()).andExpect(jsonPath("$.code").value("INVITE_REVOKED"));
        join(c, expiredCode).andExpect(status().isGone()).andExpect(jsonPath("$.code").value("INVITE_EXPIRED"));
        join(c, "ZZZZZZZZ").andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INVITE_NOT_FOUND"));
        assertThat(familyIdInDb(c)).isNull();
        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", c.id())).isZero();

        mvc.perform(get("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(jsonPath("$[?(@.id==" + revokeId + ")].status").value("REVOKED"))
                .andExpect(jsonPath("$[?(@.code=='" + expiredCode + "')].status").value("EXPIRED"));

        // Thu hồi lần hai không lỗi
        mvc.perform(delete("/api/family/invitations/" + revokeId).header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isNoContent());
    }

    @Test
    void joinValidatesInput() throws Exception {
        TestUser a = newUser();
        postJson("/api/family/join", a, "{}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field=='code')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field=='acceptPolicy')]").exists());
        postJson("/api/family/join", a, "{\"code\":\"ABCDEFGH\",\"acceptPolicy\":false}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyManagerManagesInvitationsAndMembers() throws Exception {
        Fixture f = familyWithMember();
        mvc.perform(post("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("MANAGER_ONLY"));
        mvc.perform(get("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/family/accounts/" + f.manager.id()).header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isForbidden());
        postJson("/api/family/transfer-manager", f.member, "{\"userId\":" + f.member.id() + "}")
                .andExpect(status().isForbidden());
        assertThat(roleInDb(f.manager)).isEqualTo("MANAGER");
    }

    // ---------- Xem family ----------

    @Test
    void emailShownOnlyToManagerAndOwner() throws Exception {
        Fixture f = familyWithMember();

        mvc.perform(get("/api/family").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accounts.length()").value(2))
                .andExpect(jsonPath("$.accounts[0].familyRole").value("MANAGER"))
                .andExpect(jsonPath("$.accounts[?(@.id==" + f.member.id() + ")].email").value(f.member.email()))
                .andExpect(jsonPath("$.accounts[?(@.id==" + f.manager.id() + ")].email").value(f.manager.email()));

        // Token của member là token cũ (chưa có claim family) nhưng vẫn xem được vì quyền đọc từ DB
        MvcResult asMember = mvc.perform(get("/api/family/" + f.familyId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accounts.length()").value(2))
                .andExpect(jsonPath("$.accounts[?(@.id==" + f.member.id() + ")].email").value(f.member.email()))
                .andReturn();
        String body = asMember.getResponse().getContentAsString();
        assertThat(body).doesNotContain(f.manager.email());
        assertThat(JsonPath.<List<Object>>read(body, "$.accounts[?(@.id==" + f.manager.id() + ")].email")).isEmpty();
        assertNoSecrets(asMember);
    }

    @Test
    void userWithoutFamilyGetsNotFound() throws Exception {
        TestUser a = newUser();
        mvc.perform(get("/api/family").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("FAMILY_NOT_FOUND"));
    }

    // ---------- Rời, loại, chuyển quyền ----------

    @Test
    void managerCannotLeaveUntilTransferThenBothSessionsAreRevoked() throws Exception {
        Fixture f = familyWithMember();

        mvc.perform(post("/api/family/leave").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MANAGER_MUST_TRANSFER"));
        assertThat(familyIdInDb(f.manager)).isEqualTo(f.familyId);

        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + f.member.id() + "}")
                .andExpect(status().isNoContent());
        assertThat(roleInDb(f.member)).isEqualTo("MANAGER");
        assertThat(roleInDb(f.manager)).isEqualTo("MEMBER");
        assertThat(count("SELECT COUNT(*) FROM user_account WHERE family_id = ? AND family_role = 'MANAGER'",
                f.familyId)).isEqualTo(1);
        refresh(f.manager).andExpect(status().isUnauthorized());
        refresh(f.member).andExpect(status().isUnauthorized());

        // Manager cũ giờ chỉ là User: hết quyền quản lý dù token cũ còn hạn
        mvc.perform(post("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/family/leave").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isNoContent());
        assertThat(familyIdInDb(f.manager)).isNull();
        assertThat(roleInDb(f.manager)).isNull();
        // Family không bị xóa và vẫn có đúng một Manager
        assertThat(count("SELECT COUNT(*) FROM user_account WHERE family_id = ? AND family_role = 'MANAGER'",
                f.familyId)).isEqualTo(1);
        // Bản ghi đồng ý không mất khi rời
        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", f.manager.id())).isEqualTo(1);
    }

    @Test
    void transferRejectsSelfAndPeopleOutsideTheFamily() throws Exception {
        Fixture f = familyWithMember();
        TestUser outsider = newUser();
        Fixture other = familyWithMember();

        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + f.manager.id() + "}")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CANNOT_TRANSFER_TO_SELF"));
        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + outsider.id() + "}")
                .andExpect(status().isNotFound());
        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + other.member.id() + "}")
                .andExpect(status().isNotFound());
        postJson("/api/family/transfer-manager", f.manager, "{}").andExpect(status().isBadRequest());

        // Không chuyển cho tài khoản đang bị khóa
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE id = ?", f.member.id());
        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + f.member.id() + "}")
                .andExpect(status().isNotFound());
        assertThat(roleInDb(f.manager)).isEqualTo("MANAGER");
    }

    @Test
    void memberLeavesAndLosesLinkAndSessions() throws Exception {
        Fixture f = familyWithMember();
        jdbc.update("UPDATE user_account SET member_id = 99 WHERE id = ?", f.member.id());

        mvc.perform(post("/api/family/leave").header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isNoContent());

        assertThat(familyIdInDb(f.member)).isNull();
        assertThat(jdbc.queryForObject("SELECT member_id FROM user_account WHERE id = ?", Long.class, f.member.id()))
                .isNull();
        refresh(f.member).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/family").header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/family").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(jsonPath("$.accounts.length()").value(1));
        // Người rời vẫn thấy Manager còn phiên
        refresh(f.manager).andExpect(status().isOk());

        // Sau khi rời có thể tham gia lại (đăng nhập lại là có token mới)
        String code = inviteCode(f.manager);
        TestUser again = login(f.member);
        join(again, code).andExpect(status().isOk());
        assertThat(count("SELECT COUNT(*) FROM user_consent WHERE user_id = ? AND family_id IS NOT NULL", f.member.id())).isEqualTo(2);
    }

    @Test
    void lockedAccountCannotActEvenWithValidToken() throws Exception {
        Fixture f = familyWithMember();
        jdbc.update("UPDATE user_account SET status = 'LOCKED', lock_reason = 'MANUAL' WHERE id = ?", f.manager.id());
        mvc.perform(post("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        mvc.perform(get("/api/family").header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isForbidden());
    }

    @Test
    void userWithoutFamilyCannotLeave() throws Exception {
        TestUser a = newUser();
        mvc.perform(post("/api/family/leave").header(HttpHeaders.AUTHORIZATION, bearer(a)))
                .andExpect(status().isNotFound());
    }

    @Test
    void managerRemovesAccountAndRevokesItsSessions() throws Exception {
        Fixture f = familyWithMember();
        jdbc.update("UPDATE user_account SET member_id = 42 WHERE id = ?", f.member.id());

        mvc.perform(delete("/api/family/accounts/" + f.manager.id()).header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CANNOT_REMOVE_SELF"));

        mvc.perform(delete("/api/family/accounts/" + f.member.id()).header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isNoContent());
        assertThat(familyIdInDb(f.member)).isNull();
        assertThat(jdbc.queryForObject("SELECT member_id FROM user_account WHERE id = ?", Long.class, f.member.id()))
                .isNull();
        refresh(f.member).andExpect(status().isUnauthorized());
        // Token truy cập cũ của người bị loại không còn xem được family
        mvc.perform(get("/api/family/" + f.familyId).header(HttpHeaders.AUTHORIZATION, bearer(f.member)))
                .andExpect(status().isNotFound());
        refresh(f.manager).andExpect(status().isOk());
        mvc.perform(delete("/api/family/accounts/" + f.member.id()).header(HttpHeaders.AUTHORIZATION, bearer(f.manager)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
    }

    @Test
    void auditLogRecordsMembershipChangesWithoutInviteCode() throws Exception {
        Fixture f = familyWithMember();
        postJson("/api/family/transfer-manager", f.manager, "{\"userId\":" + f.member.id() + "}")
                .andExpect(status().isNoContent());

        List<String> actions = jdbc.queryForList(
                "SELECT action FROM audit_log WHERE family_id = ? ORDER BY id", String.class, f.familyId);
        assertThat(actions).containsExactly("CREATE", "CREATE", "JOIN", "TRANSFER_MANAGER");
        String invitationLog = jdbc.queryForObject(
                "SELECT after_data FROM audit_log WHERE family_id = ? AND target_type = 'FAMILY_INVITATION'",
                String.class, f.familyId);
        assertThat(invitationLog).doesNotContain(
                jdbc.queryForObject("SELECT code FROM family_invitation WHERE family_id = ?", String.class, f.familyId));
    }

    // ---------- Cách ly family ----------

    @Test
    void crossFamilyAccessReturnsNotFound() throws Exception {
        Fixture one = familyWithMember();
        Fixture two = familyWithMember();
        long invitationOfOne = count("SELECT id FROM family_invitation WHERE family_id = ?", one.familyId);

        // Xem family khác theo id
        mvc.perform(get("/api/family/" + one.familyId).header(HttpHeaders.AUTHORIZATION, bearer(two.manager)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("FAMILY_NOT_FOUND"));
        mvc.perform(get("/api/family/" + one.familyId).header(HttpHeaders.AUTHORIZATION, bearer(two.member)))
                .andExpect(status().isNotFound());
        // Thu hồi mã mời của family khác
        mvc.perform(delete("/api/family/invitations/" + invitationOfOne)
                        .header(HttpHeaders.AUTHORIZATION, bearer(two.manager)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INVITE_NOT_FOUND"));
        assertThat(count("SELECT COUNT(*) FROM family_invitation WHERE id = ? AND revoked_at IS NULL",
                invitationOfOne)).isEqualTo(1);
        // Loại tài khoản của family khác
        mvc.perform(delete("/api/family/accounts/" + one.member.id())
                        .header(HttpHeaders.AUTHORIZATION, bearer(two.manager)))
                .andExpect(status().isNotFound());
        assertThat(familyIdInDb(one.member)).isEqualTo(one.familyId);
        // Danh sách mã mời chỉ gồm mã của chính family mình
        mvc.perform(get("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(two.manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + invitationOfOne + ")]").isEmpty());
    }

    @Test
    void facadeReadsMembershipFromDatabase() throws Exception {
        Fixture f = familyWithMember();
        assertThat(facade.membershipOf(f.manager.id())).hasValueSatisfying(m -> {
            assertThat(m.familyId()).isEqualTo(f.familyId);
            assertThat(m.isManager()).isTrue();
        });
        assertThat(facade.membershipOf(f.member.id())).hasValueSatisfying(m -> assertThat(m.isManager()).isFalse());
        assertThat(facade.isManagerOf(f.member.id(), f.familyId)).isFalse();
        assertThat(facade.isActiveMemberOf(f.member.id(), f.familyId)).isTrue();
        assertThat(facade.isActiveMemberOf(f.member.id(), f.familyId + 1000)).isFalse();
        assertThat(facade.membershipOf(newUser().id())).isEmpty();
        assertThat(facade.membershipOf(-1L)).isEmpty();
    }

    // ---------- Helper ----------

    /** Một family có Manager và một User (đã tham gia bằng mã mời). */
    private record Fixture(TestUser manager, TestUser member, long familyId) {
    }

    private Fixture familyWithMember() throws Exception {
        TestUser manager = newUser();
        long familyId = familyIdOf(createFamily(manager, "Họ " + UUID.randomUUID().toString().substring(0, 8))
                .andReturn());
        TestUser member = newUser();
        join(member, inviteCode(manager)).andExpect(status().isOk());
        return new Fixture(manager, member, familyId);
    }

    private TestUser newUser() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        postRaw("/api/auth/register", """
                {"fullName":"Nguyễn Văn A","email":"%s","password":"%s","confirmPassword":"%s","acceptTerms":true}"""
                .formatted(email, PASSWORD, PASSWORD)).andExpect(status().isOk());
        MvcResult verified = postRaw("/api/auth/verify-otp",
                "{\"email\":\"" + email + "\",\"otp\":\"" + mail.lastOtp(email) + "\"}")
                .andExpect(status().isOk()).andReturn();
        // Tài khoản mới ở WAITING; Admin duyệt rồi đăng nhập lại để claim approval=APPROVED (DECISIONS #56)
        jdbc.update("UPDATE user_account SET approval_status = 'APPROVED' WHERE email = ?", email);
        return login(fromAuth(email, verified));
    }

    private TestUser login(TestUser user) throws Exception {
        MvcResult result = postRaw("/api/auth/login",
                "{\"email\":\"" + user.email() + "\",\"password\":\"" + PASSWORD + "\"}")
                .andExpect(status().isOk()).andReturn();
        return fromAuth(user.email(), result);
    }

    private static TestUser fromAuth(String email, MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        String header = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(header).startsWith(COOKIE + "=");
        return new TestUser(((Number) JsonPath.read(body, "$.user.id")).longValue(), email,
                JsonPath.read(body, "$.accessToken"),
                header.substring((COOKIE + "=").length(), header.indexOf(';')));
    }

    private ResultActions createFamily(TestUser user, String name) throws Exception {
        return postJson("/api/family", user,
                "{\"name\":\"%s\",\"originPlace\":\"Nam Định\",\"description\":\"Dòng họ thử\",\"acceptPolicy\":true}"
                        .formatted(name));
    }

    private ResultActions join(TestUser user, String code) throws Exception {
        return postJson("/api/family/join", user, "{\"code\":\"%s\",\"acceptPolicy\":true}".formatted(code));
    }

    private MvcResult createInvitation(TestUser manager) throws Exception {
        return mvc.perform(post("/api/family/invitations").header(HttpHeaders.AUTHORIZATION, bearer(manager)))
                .andExpect(status().isCreated()).andReturn();
    }

    private String inviteCode(TestUser manager) throws Exception {
        return JsonPath.read(createInvitation(manager).getResponse().getContentAsString(), "$.code");
    }

    private ResultActions refresh(TestUser user) throws Exception {
        return mvc.perform(post("/api/auth/refresh").cookie(new Cookie(COOKIE, user.cookie())));
    }

    private ResultActions postJson(String url, TestUser user, String json) throws Exception {
        return mvc.perform(post(url).header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions postRaw(String url, String json) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static String bearer(TestUser user) {
        return "Bearer " + user.token();
    }

    private static long familyIdOf(MvcResult result) throws Exception {
        return ((Number) JsonPath.read(result.getResponse().getContentAsString(), "$.id")).longValue();
    }

    private Long familyIdInDb(TestUser user) {
        return jdbc.queryForObject("SELECT family_id FROM user_account WHERE id = ?", Long.class, user.id());
    }

    private String roleInDb(TestUser user) {
        return jdbc.queryForObject("SELECT family_role FROM user_account WHERE id = ?", String.class, user.id());
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    private static void assertNoSecrets(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        for (String fragment : FORBIDDEN_FRAGMENTS) {
            assertThat(body).as("response không được chứa %s", fragment).doesNotContain(fragment);
        }
    }
}
