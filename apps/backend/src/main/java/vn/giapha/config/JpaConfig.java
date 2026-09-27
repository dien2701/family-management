package vn.giapha.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JpaConfig {

    /** Thời điểm lưu luôn là UTC; test có thể thay bằng Clock cố định. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
