package vn.giapha.common.security;

import java.time.Clock;
import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import vn.giapha.config.AppProperties;

/** Phát access token JWT HS256 (DECISIONS #18). Claim rỗng thì bỏ qua để token gọn. */
@Component
public class JwtService {

    private final JwtEncoder encoder;
    private final Clock clock;
    private final AppProperties props;

    JwtService(JwtEncoder encoder, Clock clock, AppProperties props) {
        this.encoder = encoder;
        this.clock = clock;
        this.props = props;
    }

    public String createAccessToken(CurrentUser user) {
        Instant now = Instant.now(clock);
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .subject(String.valueOf(user.userId()))
                .issuedAt(now)
                .expiresAt(now.plus(props.jwt().accessTtl()))
                .claim(CurrentUser.CLAIM_SYSTEM_ROLE, user.systemRole())
                .claim(CurrentUser.CLAIM_APPROVAL, user.approval());
        if (user.memberId() != null) {
            claims.claim(CurrentUser.CLAIM_MEMBER_ID, user.memberId());
        }
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
    }

    public long accessTtlSeconds() {
        return props.jwt().accessTtl().toSeconds();
    }
}
