package vn.giapha.auth.google;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Date;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import vn.giapha.common.exception.BusinessException;

/** Kiểm tra logic aud/iss/exp bằng khóa RSA sinh tại chỗ (không gọi mạng tới Google). */
class NimbusGoogleIdTokenVerifierTest {

    private static final String CLIENT_ID = "my-client.apps.googleusercontent.com";

    private static KeyPair keyPair;
    private final NimbusGoogleIdTokenVerifier verifier = new NimbusGoogleIdTokenVerifier(
            NimbusJwtDecoder.withPublicKey((RSAPublicKey) keyPair.getPublic()).build(), CLIENT_ID);

    @BeforeAll
    static void generateKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
    }

    @Test
    void acceptsValidTokenFromEitherGoogleIssuerForm() throws Exception {
        for (String iss : new String[] {"https://accounts.google.com", "accounts.google.com"}) {
            GoogleIdentity id = verifier.verify(token(claims(iss, CLIENT_ID, Duration.ofHours(1)), keyPair));
            assertThat(id.sub()).isEqualTo("sub-123");
            assertThat(id.email()).isEqualTo("nguoi@example.com");
            assertThat(id.emailVerified()).isTrue();
            assertThat(id.name()).isEqualTo("Nguyễn Văn A");
        }
    }

    @Test
    void rejectsWrongAudience() throws Exception {
        assertInvalid(token(claims("https://accounts.google.com", "app-khac", Duration.ofHours(1)), keyPair));
    }

    @Test
    void rejectsWrongIssuer() throws Exception {
        assertInvalid(token(claims("https://ke-tan-cong.example", CLIENT_ID, Duration.ofHours(1)), keyPair));
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        assertInvalid(token(claims("https://accounts.google.com", CLIENT_ID, Duration.ofHours(-1)), keyPair));
    }

    @Test
    void rejectsTokenSignedByAnotherKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        assertInvalid(token(claims("https://accounts.google.com", CLIENT_ID, Duration.ofHours(1)),
                generator.generateKeyPair()));
    }

    @Test
    void rejectsGarbage() {
        assertInvalid("khong-phai-jwt");
    }

    @Test
    void reportsUnavailableWhenClientIdIsNotConfigured() {
        NimbusGoogleIdTokenVerifier unconfigured = new NimbusGoogleIdTokenVerifier(
                NimbusJwtDecoder.withPublicKey((RSAPublicKey) keyPair.getPublic()).build(), "");
        assertThatThrownBy(() -> unconfigured.verify("bat-ky"))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(503);
                    assertThat(e.getCode()).isEqualTo("GOOGLE_NOT_CONFIGURED");
                });
    }

    private void assertInvalid(String token) {
        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(401);
                    assertThat(e.getCode()).isEqualTo("GOOGLE_TOKEN_INVALID");
                });
    }

    private static JWTClaimsSet claims(String issuer, String audience, Duration validFor) {
        Date now = new Date();
        return new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(audience)
                .subject("sub-123")
                .claim("email", "nguoi@example.com")
                .claim("email_verified", true)
                .claim("name", "Nguyễn Văn A")
                .issueTime(new Date(now.getTime() - 7_200_000))
                .expirationTime(new Date(now.getTime() + validFor.toMillis()))
                .build();
    }

    private static String token(JWTClaimsSet claims, KeyPair signWith) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        jwt.sign(new RSASSASigner((RSAPrivateKey) signWith.getPrivate()));
        return jwt.serialize();
    }
}
