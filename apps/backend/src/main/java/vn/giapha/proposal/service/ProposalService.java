package vn.giapha.proposal.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.common.web.SimplePage;
import vn.giapha.event.EventFacade;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.proposal.ProposalCreatedEvent;
import vn.giapha.proposal.ProposalReviewedEvent;
import vn.giapha.proposal.dto.ApproveProposalRequest;
import vn.giapha.proposal.dto.ProposalInput;
import vn.giapha.proposal.dto.ProposalResponse;
import vn.giapha.proposal.dto.RejectProposalRequest;
import vn.giapha.proposal.entity.Proposal;
import vn.giapha.proposal.entity.ProposalAction;
import vn.giapha.proposal.entity.ProposalStatus;
import vn.giapha.proposal.mapper.ProposalMapper;
import vn.giapha.proposal.repository.ProposalRepository;

/**
 * Đề xuất sự kiện chung (IDEA §6.6; DECISIONS #65, #77): User gửi, không cần liên kết "Tôi là ai"; Admin duyệt (áp
 * dụng qua {@link EventFacade} trong cùng transaction) hoặc từ chối kèm lý do. Vai trò Admin luôn đọc từ DB.
 */
@Service
public class ProposalService {

    private static final String TARGET_TYPE = "EVENT";

    private final ProposalRepository repository;
    private final ProposalMapper mapper;
    private final AuthFacade auth;
    private final EventFacade eventFacade;
    private final AuditLogWriter audit;
    private final ApplicationEventPublisher publisher;
    private final Validator validator;
    private final JsonMapper json;
    private final Clock clock;

    ProposalService(ProposalRepository repository, ProposalMapper mapper, AuthFacade auth, EventFacade eventFacade,
            AuditLogWriter audit, ApplicationEventPublisher publisher, Validator validator, JsonMapper json,
            Clock clock) {
        this.repository = repository;
        this.mapper = mapper;
        this.auth = auth;
        this.eventFacade = eventFacade;
        this.audit = audit;
        this.publisher = publisher;
        this.validator = validator;
        this.json = json;
        this.clock = clock;
    }

    @Transactional
    public ProposalResponse create(Long actorId, ProposalInput input) {
        if (!TARGET_TYPE.equals(input.targetType())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_TARGET_TYPE",
                    "Chỉ nhận đề xuất cho sự kiện chung.");
        }
        ProposalAction action = parseAction(input.action());
        Instant baseUpdatedAt = null;
        String payloadJson = null;
        switch (action) {
            case CREATE -> payloadJson = json.writeValueAsString(validatedEventInput(input.payload()));
            case UPDATE -> {
                CustomEventResponse target = eventFacade.get(requireTargetId(input.targetId()));
                baseUpdatedAt = target.updatedAt();
                payloadJson = json.writeValueAsString(validatedEventInput(input.payload()));
            }
            case DELETE -> {
                CustomEventResponse target = eventFacade.get(requireTargetId(input.targetId()));
                baseUpdatedAt = target.updatedAt();
            }
        }
        Proposal proposal = new Proposal(actorId, TARGET_TYPE, action, input.targetId(), payloadJson, baseUpdatedAt,
                Instant.now(clock));
        repository.save(proposal);
        publisher.publishEvent(new ProposalCreatedEvent(proposal.getId(), actorId));
        return toResponse(proposal);
    }

    @Transactional(readOnly = true)
    public SimplePage<ProposalResponse> list(Long actorId, String status, int page, int size) {
        requireAdmin(actorId);
        PageRequest pageable = PageRequest.of(zeroIndexed(page), size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Proposal> result = status == null || status.isBlank()
                ? repository.findAllByOrderByCreatedAtDesc(pageable)
                : repository.findAllByStatusOrderByCreatedAtDesc(parseStatus(status), pageable);
        return toPage(result);
    }

    @Transactional(readOnly = true)
    public SimplePage<ProposalResponse> mine(Long actorId, int page, int size) {
        Page<Proposal> result = repository.findAllByAccountIdOrderByCreatedAtDesc(actorId,
                PageRequest.of(zeroIndexed(page), size, Sort.by(Sort.Order.desc("createdAt"))));
        return toPage(result);
    }

    @Transactional(readOnly = true)
    public long countPending(Long actorId) {
        requireAdmin(actorId);
        return repository.countByStatus(ProposalStatus.PENDING);
    }

    @Transactional
    public void approve(Long actorId, Long id, ApproveProposalRequest req) {
        requireAdmin(actorId);
        Proposal proposal = find(id);
        requirePending(proposal);
        Map<String, Object> payload = req != null && req.modifiedPayload() != null ? req.modifiedPayload() : null;
        switch (proposal.getAction()) {
            case CREATE ->
                eventFacade.create(actorId, validatedEventInput(payload != null ? payload : payloadOf(proposal)));
            case UPDATE -> eventFacade.update(actorId, proposal.getTargetId(),
                    validatedEventInput(payload != null ? payload : payloadOf(proposal)));
            case DELETE -> eventFacade.delete(actorId, proposal.getTargetId());
        }
        proposal.approve(payload == null ? null : json.writeValueAsString(payload));
        audit.write(actorId, "APPROVE", "PROPOSAL", proposal.getId(), Map.of("status", ProposalStatus.PENDING),
                Map.of("status", ProposalStatus.APPROVED));
        publisher.publishEvent(new ProposalReviewedEvent(proposal.getId(), proposal.getAccountId(), true, null));
    }

    @Transactional
    public void reject(Long actorId, Long id, RejectProposalRequest req) {
        requireAdmin(actorId);
        Proposal proposal = find(id);
        requirePending(proposal);
        proposal.reject(req.note());
        audit.write(actorId, "REJECT", "PROPOSAL", proposal.getId(), Map.of("status", ProposalStatus.PENDING),
                Map.of("status", ProposalStatus.REJECTED, "note", req.note()));
        publisher.publishEvent(
                new ProposalReviewedEvent(proposal.getId(), proposal.getAccountId(), false, req.note()));
    }

    // ---------- Nội bộ ----------

    private Proposal find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PROPOSAL_NOT_FOUND",
                        "Không tìm thấy đề xuất này."));
    }

    private static void requirePending(Proposal proposal) {
        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "PROPOSAL_ALREADY_REVIEWED",
                    "Đề xuất không còn ở trạng thái chờ.");
        }
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }

    private static int zeroIndexed(int page) {
        return Math.max(page - 1, 0);
    }

    private static Long requireTargetId(Long targetId) {
        if (targetId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vui lòng chọn sự kiện.",
                    List.of(new FieldError("targetId", "Vui lòng chọn sự kiện cần sửa hoặc xóa.")));
        }
        return targetId;
    }

    private static ProposalAction parseAction(String raw) {
        try {
            return ProposalAction.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Hành động không hợp lệ.",
                    List.of(new FieldError("action", "Hành động không hợp lệ.")));
        }
    }

    private static ProposalStatus parseStatus(String raw) {
        try {
            return ProposalStatus.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Trạng thái không hợp lệ.",
                    List.of(new FieldError("status", "Trạng thái không hợp lệ.")));
        }
    }

    /** Cùng validator với {@code POST /api/events}: Bean Validation trên {@link CustomEventInput}, rồi quy tắc
     * ngày âm/dương của {@code EventInputParser} qua {@link EventFacade#validate}. */
    @SuppressWarnings("unchecked")
    private CustomEventInput validatedEventInput(Map<String, Object> payload) {
        CustomEventInput input = eventInputOf(payload);
        Set<ConstraintViolation<CustomEventInput>> violations = validator.validate(input);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException((Set<ConstraintViolation<?>>) (Set<?>) violations);
        }
        eventFacade.validate(input);
        return input;
    }

    private CustomEventInput eventInputOf(Map<String, Object> payload) {
        if (payload == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vui lòng nhập nội dung sự kiện.",
                    List.of(new FieldError("payload", "Vui lòng nhập nội dung sự kiện.")));
        }
        try {
            return json.convertValue(payload, CustomEventInput.class);
        } catch (RuntimeException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không đúng định dạng.",
                    List.of(new FieldError("payload", "Dữ liệu không đúng định dạng.")));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> payloadOf(Proposal proposal) {
        return proposal.getPayload() == null ? null : json.readValue(proposal.getPayload(), Map.class);
    }

    private ProposalResponse toResponse(Proposal proposal) {
        String name = auth.find(proposal.getAccountId()).map(AuthFacade.Account::fullName).orElse("");
        return mapper.toResponse(proposal, name);
    }

    private SimplePage<ProposalResponse> toPage(Page<Proposal> page) {
        Map<Long, String> names = auth
                .findAll(page.getContent().stream().map(Proposal::getAccountId).distinct().toList()).stream()
                .collect(Collectors.toMap(AuthFacade.Account::id, AuthFacade.Account::fullName));
        return SimplePage.of(page, p -> mapper.toResponse(p, names.getOrDefault(p.getAccountId(), "")));
    }
}
