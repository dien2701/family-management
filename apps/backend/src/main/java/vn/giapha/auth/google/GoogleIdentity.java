package vn.giapha.auth.google;

/** Thông tin lấy từ Google ID token đã xác minh. */
public record GoogleIdentity(String sub, String email, boolean emailVerified, String name, String picture) {
}
