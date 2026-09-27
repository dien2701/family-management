package vn.giapha.event.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.event.entity.CustomEvent;
import vn.giapha.event.mapper.EventMapper;
import vn.giapha.event.repository.CustomEventRepository;

/**
 * Sự kiện chung (IDEA §6.5, §7; DECISIONS #65). Admin thêm, sửa, xóa trực tiếp; User gửi đề xuất (Đợt 33). Vai trò
 * của người gọi luôn đọc từ DB, không tin claim.
 */
@Service
public class EventService {

    private static final String TARGET_TYPE = "EVENT";

    private final CustomEventRepository repository;
    private final EventInputParser parser;
    private final EventMapper mapper;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final Clock clock;

    EventService(CustomEventRepository repository, EventInputParser parser, EventMapper mapper, AuthFacade auth,
            AuditLogWriter audit, Clock clock) {
        this.repository = repository;
        this.parser = parser;
        this.mapper = mapper;
        this.auth = auth;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<CustomEventResponse> list() {
        return repository.findAllByOrderByIdAsc().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomEventResponse get(Long id) {
        return mapper.toResponse(find(id));
    }

    @Transactional
    public CustomEventResponse create(Long actorId, CustomEventInput input) {
        requireAdmin(actorId);
        ParsedEvent p = parser.parse(input);
        Instant now = Instant.now(clock);
        CustomEvent event = new CustomEvent(actorId, now);
        event.apply(p.title(), p.description(), p.calendar(), p.day(), p.month(), p.year(), p.leap(), now);
        repository.save(event);
        CustomEventResponse response = mapper.toResponse(event);
        audit.write(actorId, "CREATE", TARGET_TYPE, event.getId(), null, response);
        return response;
    }

    @Transactional
    public CustomEventResponse update(Long actorId, Long id, CustomEventInput input) {
        requireAdmin(actorId);
        CustomEvent event = find(id);
        CustomEventResponse before = mapper.toResponse(event);
        ParsedEvent p = parser.parse(input);
        event.apply(p.title(), p.description(), p.calendar(), p.day(), p.month(), p.year(), p.leap(),
                Instant.now(clock));
        CustomEventResponse after = mapper.toResponse(event);
        audit.write(actorId, "UPDATE", TARGET_TYPE, id, before, after);
        return after;
    }

    @Transactional
    public void delete(Long actorId, Long id) {
        requireAdmin(actorId);
        CustomEvent event = find(id);
        CustomEventResponse before = mapper.toResponse(event);
        repository.delete(event);
        audit.write(actorId, "DELETE", TARGET_TYPE, id, before, null);
    }

    private CustomEvent find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND",
                        "Không tìm thấy sự kiện này."));
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }
}
