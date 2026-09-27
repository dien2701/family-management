package vn.giapha.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.support.IntegrationTest;

@IntegrationTest
class AuditLogWriterTest {

    @Autowired
    AuditLogWriter writer;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    @Transactional
    void storesBeforeAndAfterAsJson() {
        writer.write(42L, "UPDATE", "MEMBER", 99L,
                Map.of("fullName", "Nguyễn Văn A"), Map.of("fullName", "Nguyễn Văn B"));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT actor_id, action, target_type, target_id, "
                        + "JSON_UNQUOTE(JSON_EXTRACT(before_data, '$.fullName')) AS before_name, "
                        + "JSON_UNQUOTE(JSON_EXTRACT(after_data, '$.fullName')) AS after_name, "
                        + "JSON_TYPE(before_data) AS before_type, created_at "
                        + "FROM audit_log WHERE target_id = 99");

        assertThat(row.get("actor_id")).isEqualTo(42L);
        assertThat(row.get("action")).isEqualTo("UPDATE");
        assertThat(row.get("target_type")).isEqualTo("MEMBER");
        assertThat(row.get("before_name")).isEqualTo("Nguyễn Văn A");
        assertThat(row.get("after_name")).isEqualTo("Nguyễn Văn B");
        // phải là object JSON thật, không phải chuỗi bị bọc thêm lần nữa
        assertThat(row.get("before_type")).isEqualTo("OBJECT");
        assertThat(row.get("created_at")).isNotNull();
    }

    @Test
    @Transactional
    void createHasNullBefore() {
        writer.write(null, "CREATE", "MEMBER", 100L, null, Map.of("fullName", "Trần Thị C"));

        Map<String, Object> row = jdbc.queryForMap(
                "SELECT before_data, after_data FROM audit_log WHERE target_id = 100");
        assertThat(row.get("before_data")).isNull();
        assertThat(row.get("after_data")).isNotNull();
    }

    @Test
    void requiresSurroundingTransaction() {
        assertThatThrownBy(() -> writer.write(1L, "CREATE", "MEMBER", 1L, null, Map.of()))
                .isInstanceOf(IllegalTransactionStateException.class);
    }
}
