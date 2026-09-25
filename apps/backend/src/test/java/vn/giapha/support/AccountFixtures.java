package vn.giapha.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.jayway.jsonpath.JsonPath;

import jakarta.servlet.http.Cookie;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Dựng tài khoản thử qua API thật (đăng ký, OTP, đăng nhập), rồi đổi trạng thái duyệt/vai trò bằng SQL như một Admin đã
 * làm. Token luôn lấy sau khi đổi để claim {@code approval}/{@code sysRole} khớp DB.
 */
public class AccountFixtures {

    public static final String PASSWORD = "matkhau-manh-1";
    public static final String REFRESH_COOKIE = "refresh_token";

    /** Phiên đăng nhập của một tài khoản thử. */
    public record Session(long id, String email, String token, String cookie) {

        public String bearer() {
            return "Bearer " + token;
        }
    }

    private final MockMvc mvc;
    private final JdbcTemplate jdbc;
    private final RecordingMailSender mail;

    public AccountFixtures(MockMvc mvc, JdbcTemplate jdbc, RecordingMailSender mail) {
        this.mvc = mvc;
        this.jdbc = jdbc;
        this.mail = mail;
    }

    public static String newEmail() {
        return "acct-" + UUID.randomUUID() + "@example.com";
    }

    /** Chuỗi chữ cái ngẫu nhiên, dùng làm dấu để lọc riêng tài khoản của một test trong DB dùng chung. */
    public static String marker() {
        StringBuilder sb = new StringBuilder("k");
        ThreadLocalRandom.current().ints(9, 'a', 'z' + 1).forEach(c -> sb.append((char) c));
        return sb.toString();
    }

    /** Tài khoản ACTIVE, còn WAITING: đúng trạng thái người vừa xác thực OTP. */
    public Session waiting() throws Exception {
        return waiting(newEmail(), "Nguyễn Văn A");
    }

    public Session waiting(String email, String fullName) throws Exception {
        register(email, fullName);
        MvcResult verified = mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"otp\":\"%s\"}".formatted(email, mail.lastOtp(email))))
                .andExpect(status().isOk()).andReturn();
        return session(email, verified);
    }

    public Session approved() throws Exception {
        return approved(newEmail(), "Nguyễn Văn A");
    }

    public Session approved(String email, String fullName) throws Exception {
        waiting(email, fullName);
        jdbc.update("UPDATE user_account SET approval_status = 'APPROVED', approved_at = NOW(6) WHERE email = ?", email);
        return login(email);
    }

    public Session admin() throws Exception {
        Session s = approved();
        jdbc.update("UPDATE user_account SET system_role = 'ADMIN' WHERE id = ?", s.id());
        return login(s.email());
    }

    public Session login(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PASSWORD)))
                .andExpect(status().isOk()).andReturn();
        return session(email, result);
    }

    public ResultActions refresh(Session s) throws Exception {
        return mvc.perform(post("/api/auth/refresh").cookie(new Cookie(REFRESH_COOKIE, s.cookie())));
    }

    /** Đăng nhập lại bằng refresh cookie để lấy claim mới, như trang "chờ duyệt" làm khi được duyệt. */
    public Session refreshed(Session s) throws Exception {
        MvcResult result = refresh(s).andExpect(status().isOk()).andReturn();
        return session(s.email(), result);
    }

    /** Chỉ giữ lại đúng các Admin này; mọi Admin khác (do test khác để lại) về User, để kiểm tra "Admin cuối cùng". */
    public void onlyAdmins(long... ids) {
        StringBuilder in = new StringBuilder("0");
        for (long id : ids) {
            in.append(',').append(id);
        }
        jdbc.update("UPDATE user_account SET system_role = 'USER' WHERE system_role = 'ADMIN' AND id NOT IN ("
                + in + ")");
    }

    public static Session session(String email, MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        String header = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        return new Session(((Number) JsonPath.read(body, "$.user.id")).longValue(), email,
                JsonPath.read(body, "$.accessToken"),
                header.substring((REFRESH_COOKIE + "=").length(), header.indexOf(';')));
    }

    private void register(String email, String fullName) throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"%s","email":"%s","password":"%s","confirmPassword":"%s","acceptTerms":true}"""
                .formatted(fullName, email, PASSWORD, PASSWORD))).andExpect(status().isOk());
    }
}
