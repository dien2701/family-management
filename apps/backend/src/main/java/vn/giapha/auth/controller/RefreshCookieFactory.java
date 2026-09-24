package vn.giapha.auth.controller;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import vn.giapha.config.AppProperties;

/** Cookie refresh token: {@code HttpOnly; Secure; SameSite=Strict; Path=/api/auth} (DECISIONS #17). */
@Component
class RefreshCookieFactory {

    static final String NAME = "refresh_token";
    private static final String PATH = "/api/auth";

    private final AppProperties props;

    RefreshCookieFactory(AppProperties props) {
        this.props = props;
    }

    String create(String token) {
        return build(token, props.auth().refreshTtl());
    }

    String clear() {
        return build("", Duration.ZERO);
    }

    private String build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(props.auth().cookieSecure())
                .sameSite("Strict")
                .path(PATH)
                .maxAge(maxAge)
                .build()
                .toString();
    }
}
