package vn.giapha.ai.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.ai.dto.AiDraft;
import vn.giapha.ai.dto.AiDraftRecord;
import vn.giapha.ai.dto.AiDraftStatus;
import vn.giapha.ai.entity.AiMessage;
import vn.giapha.ai.repository.AiMessageRepository;
import vn.giapha.auth.AuthFacade;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.proposal.ProposalFacade;
import vn.giapha.proposal.dto.ProposalInput;

/**
 * Gửi hoặc áp dụng bản nháp do AI soạn (IDEA §10; DECISIONS #77). Bản nháp chỉ dùng được trong
 * {@value #TTL_HOURS} giờ kể từ lúc soạn (draft "lưu tạm, có TTL"): quá hạn thì phải hỏi trợ lý soạn lại.
 */
@Service
public class AiDraftService {

    static final int TTL_HOURS = 24;
    private static final Duration TTL = Duration.ofHours(TTL_HOURS);

    private final AiMessageRepository messages;
    private final ProposalFacade proposals;
    private final AuthFacade auth;
    private final JsonMapper json;
    private final Clock clock;

    AiDraftService(AiMessageRepository messages, ProposalFacade proposals, AuthFacade auth, JsonMapper json,
            Clock clock) {
        this.messages = messages;
        this.proposals = proposals;
        this.auth = auth;
        this.json = json;
        this.clock = clock;
    }

    /** User gửi bản nháp của chính mình thành đề xuất (hàng đợi PENDING như đề xuất thường). */
    @Transactional
    public AiDraft submit(Long actorId, Long draftId) {
        AiMessage row = requireMessage(draftId);
        if (!row.getAccountId().equals(actorId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ có thể gửi bản nháp của chính mình.");
        }
        AiDraftRecord record = requirePending(row);
        proposals.create(actorId, toProposalInput(record));
        return finish(row, record, AiDraftStatus.SUBMITTED);
    }

    /** Admin tạo và duyệt đề xuất ngay (bỏ qua hàng đợi); ghi audit log qua {@code ProposalService.approve}. */
    @Transactional
    public AiDraft apply(Long actorId, Long draftId) {
        requireAdmin(actorId);
        AiMessage row = requireMessage(draftId);
        AiDraftRecord record = requirePending(row);
        Long proposalId = proposals.create(actorId, toProposalInput(record));
        proposals.approve(actorId, proposalId);
        return finish(row, record, AiDraftStatus.APPLIED);
    }

    private AiMessage requireMessage(Long draftId) {
        return messages.findById(draftId).orElseThrow(() -> notFound());
    }

    private AiDraftRecord requirePending(AiMessage row) {
        if (row.getDraftJson() == null) {
            throw notFound();
        }
        AiDraftRecord record = json.readValue(row.getDraftJson(), AiDraftRecord.class);
        if (record.status() != AiDraftStatus.PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "AI_DRAFT_ALREADY_REVIEWED",
                    "Bản nháp không còn ở trạng thái chờ.");
        }
        if (row.getCreatedAt().plus(TTL).isBefore(Instant.now(clock))) {
            throw new BusinessException(HttpStatus.CONFLICT, "AI_DRAFT_EXPIRED",
                    "Bản nháp đã hết hạn, vui lòng hỏi trợ lý soạn lại.");
        }
        return record;
    }

    private static ProposalInput toProposalInput(AiDraftRecord record) {
        return new ProposalInput("EVENT", record.action().name(), record.eventId(), record.payload());
    }

    private AiDraft finish(AiMessage row, AiDraftRecord record, AiDraftStatus status) {
        AiDraftRecord updated = record.withStatus(status);
        row.changeDraft(json.writeValueAsString(updated));
        messages.save(row);
        return updated.toPublic();
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }

    private static BusinessException notFound() {
        return new BusinessException(HttpStatus.NOT_FOUND, "AI_DRAFT_NOT_FOUND", "Không tìm thấy bản nháp này.");
    }
}
