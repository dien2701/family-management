package vn.giapha.auth.dto;

/** Cấu hình công khai cho trang đăng nhập; {@code googleClientId} null thì frontend ẩn nút Google. */
public record AuthConfigResponse(String googleClientId) {
}
