package vn.giapha.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.mysql.MySQLContainer;

/** MySQL 8.4 dùng chung cho mọi test tích hợp, không dùng H2 (DECISIONS #44). */
@TestConfiguration(proxyBeanMethods = false)
public class MySqlContainerConfig {

    // Một container cho cả lần chạy test; Ryuk dọn khi JVM kết thúc nên không để Spring đóng sớm
    private static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4")
            .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_0900_ai_ci");

    @Bean(destroyMethod = "")
    @ServiceConnection
    MySQLContainer mysqlContainer() {
        if (!MYSQL.isRunning()) {
            MYSQL.start();
        }
        return MYSQL;
    }
}
