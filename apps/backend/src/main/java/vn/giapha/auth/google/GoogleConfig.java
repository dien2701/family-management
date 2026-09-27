package vn.giapha.auth.google;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import vn.giapha.config.AppProperties;

@Configuration
class GoogleConfig {

    @Bean
    GoogleIdTokenVerifier googleIdTokenVerifier(AppProperties props) {
        return NimbusGoogleIdTokenVerifier.forClientId(props.google().clientId());
    }
}
