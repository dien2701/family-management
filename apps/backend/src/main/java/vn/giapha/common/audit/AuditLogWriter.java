package vn.giapha.common.audit;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Ghi audit log cho mọi thay đổi dữ liệu gia phả. Chạy trong transaction của nơi gọi
 * (MANDATORY) để log và dữ liệu cùng commit hoặc cùng rollback.
 * Với xóa cứng, truyền bản sao đầy đủ vào {@code before}.
 */
@Component
public class AuditLogWriter {

    private final AuditLogRepository repository;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    AuditLogWriter(AuditLogRepository repository, JsonMapper jsonMapper, Clock clock) {
        this.repository = repository;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    /**
     * @param actorId    user thực hiện, null với thao tác của hệ thống
     * @param action     ví dụ CREATE, UPDATE, DELETE, LOCK
     * @param targetType ví dụ MEMBER, MARRIAGE
     * @param before     trạng thái trước (null khi tạo mới); không được chứa dữ liệu nhạy cảm
     * @param after      trạng thái sau (null khi xóa)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void write(Long actorId, String action, String targetType, Long targetId,
            Object before, Object after) {
        repository.save(new AuditLog(actorId, action, targetType, targetId,
                toJson(before), toJson(after), Instant.now(clock)));
    }

    private String toJson(Object value) {
        return value == null ? null : jsonMapper.writeValueAsString(value);
    }
}
