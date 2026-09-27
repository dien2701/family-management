package vn.giapha.admin.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.admin.dto.DeletedMemberSnapshotSummaryResponse;
import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogReader;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.web.PageResponse;

/**
 * Trang "Thành viên đã xóa" (IDEA §6.10): đọc lại bản sao đã ghi vào audit log lúc xóa (DECISIONS #62), chỉ Admin.
 * Không xóa hay sửa được audit log, chỉ đọc.
 */
@Service
public class DeletedMemberQueryService {

    private static final String TARGET_TYPE = "MEMBER";
    private static final String ACTION = "DELETE";
    private static final String UNKNOWN_ACTOR = "Không rõ";

    private final AuditLogReader reader;
    private final AuthFacade auth;
    private final AdminGuard guard;
    private final JsonMapper json;

    DeletedMemberQueryService(AuditLogReader reader, AuthFacade auth, AdminGuard guard, JsonMapper json) {
        this.reader = reader;
        this.auth = auth;
        this.guard = guard;
        this.json = json;
    }

    @Transactional(readOnly = true)
    public PageResponse<DeletedMemberSnapshotSummaryResponse> list(Long actorId, int page, int size) {
        guard.require(actorId);
        Page<AuditLogReader.Row> result = reader.find(TARGET_TYPE, ACTION, PageRequest.of(page, size));
        Map<Long, String> actorNames = actorNamesOf(result.getContent());
        return PageResponse.of(result, row -> toSummary(row, actorNames));
    }

    /** Bản sao đầy đủ (member, relations, attachments) đúng như lúc xóa, trả nguyên trạng JSON đã lưu. */
    @Transactional(readOnly = true)
    public Map<String, Object> get(Long actorId, Long auditId) {
        guard.require(actorId);
        AuditLogReader.Row row = reader.findOne(auditId, TARGET_TYPE, ACTION).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "AUDIT_NOT_FOUND", "Không tìm thấy bản ghi này."));
        return parse(row.beforeData());
    }

    private Map<Long, String> actorNamesOf(List<AuditLogReader.Row> rows) {
        List<Long> ids = rows.stream().map(AuditLogReader.Row::actorId).filter(Objects::nonNull).distinct().toList();
        Map<Long, String> names = new HashMap<>();
        auth.findAll(ids).forEach(a -> names.put(a.id(), a.fullName()));
        return names;
    }

    private DeletedMemberSnapshotSummaryResponse toSummary(AuditLogReader.Row row, Map<Long, String> actorNames) {
        Map<String, Object> snapshot = parse(row.beforeData());
        Object member = snapshot.get("member");
        String fullName = member instanceof Map<?, ?> m && m.get("fullName") != null ? m.get("fullName").toString()
                : "";
        String deletedBy = row.actorId() == null ? UNKNOWN_ACTOR : actorNames.getOrDefault(row.actorId(), UNKNOWN_ACTOR);
        return new DeletedMemberSnapshotSummaryResponse(row.auditId(), row.createdAt(), deletedBy, fullName);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parse(String rawJson) {
        return (Map<String, Object>) json.readValue(rawJson, Map.class);
    }
}
