package vn.giapha.auth.google;

import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.MappedJwtClaimSetConverter;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import vn.giapha.common.exception.BusinessException;

/**
 * Kiểm tra chữ ký bằng JWKS của Google (RS256), rồi kiểm {@code exp}, {@code iss} và {@code aud}
 * (phải đúng {@code GOOGLE_CLIENT_ID} của ứng dụng).
 */
public class NimbusGoogleIdTokenVerifier implements GoogleIdTokenVerifier {

    static final String JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");
    private static final Logger log = LoggerFactory.getLogger(NimbusGoogleIdTokenVerifier.class);

    private final NimbusJwtDecoder decoder;
    private final String clientId;

    /** Bộ giải mã tải JWKS lười (lần verify đầu tiên) nên tạo lúc khởi động không chạm mạng. */
    public static NimbusGoogleIdTokenVerifier forClientId(String clientId) {
        return new NimbusGoogleIdTokenVerifier(
                NimbusJwtDecoder.withJwkSetUri(JWKS_URI).jwsAlgorithm(SignatureAlgorithm.RS256).build(), clientId);
    }

    NimbusGoogleIdTokenVerifier(NimbusJwtDecoder decoder, String clientId) {
        this.decoder = decoder;
        this.clientId = clientId;
        // Google có lúc phát iss dạng "accounts.google.com" (không phải URL); giữ nguyên là chuỗi thay vì ép sang URL
        Converter<Object, ?> asString = v -> v == null ? null : v.toString();
        decoder.setClaimSetConverter(MappedJwtClaimSetConverter.withDefaults(Map.of("iss", asString)));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(), issuerValidator(), audienceValidator(clientId)));
    }

    @Override
    public GoogleIdentity verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_NOT_CONFIGURED",
                    "Đăng nhập bằng Google chưa được cấu hình.");
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Google ID token bị từ chối: {}", e.getMessage());
            throw invalid();
        }
        String email = jwt.getClaimAsString("email");
        if (jwt.getSubject() == null || email == null || email.isBlank()) {
            throw invalid();
        }
        return new GoogleIdentity(jwt.getSubject(), email,
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
                jwt.getClaimAsString("name"), jwt.getClaimAsString("picture"));
    }

    private static BusinessException invalid() {
        return new BusinessException(HttpStatus.UNAUTHORIZED, "GOOGLE_TOKEN_INVALID",
                "Không xác minh được tài khoản Google. Vui lòng thử lại.");
    }

    private static OAuth2TokenValidator<Jwt> issuerValidator() {
        return jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "iss không hợp lệ", null));
    }

    private static OAuth2TokenValidator<Jwt> audienceValidator(String clientId) {
        return jwt -> jwt.getAudience() != null && jwt.getAudience().contains(clientId)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "aud không hợp lệ", null));
    }
}
