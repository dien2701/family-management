package vn.giapha.auth.dto;

/** Refresh token nằm trong cookie HttpOnly, không có trong body. */
public record AuthResponse(String accessToken, String tokenType, long expiresIn, MeResponse user) {

    public static AuthResponse bearer(String accessToken, long expiresIn, MeResponse user) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, user);
    }
}
