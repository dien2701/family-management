package vn.giapha.proposal.mapper;

import java.util.Map;

import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.event.EventFacade;
import vn.giapha.proposal.dto.ProposalResponse;
import vn.giapha.proposal.entity.Proposal;
import vn.giapha.proposal.entity.ProposalStatus;

/**
 * Entity sang DTO. Viết tay vì {@code accountName} tới từ module {@code auth} (gọi ở service, theo lô) và
 * {@code conflict} phải tính lại từ trạng thái hiện tại của sự kiện đích ({@code EventFacade}), không lưu.
 */
@Component
public class ProposalMapper {

    private final JsonMapper json;
    private final EventFacade events;

    ProposalMapper(JsonMapper json, EventFacade events) {
        this.json = json;
        this.events = events;
    }

    public ProposalResponse toResponse(Proposal p, String accountName) {
        return new ProposalResponse(p.getId(), p.getAccountId(), accountName, p.getTargetType(),
                p.getAction().name(), p.getTargetId(), payloadOf(p), p.getStatus().name(), p.getNote(),
                p.getBaseUpdatedAt(), conflictOf(p), p.getCreatedAt());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> payloadOf(Proposal p) {
        return p.getPayload() == null ? null : json.readValue(p.getPayload(), Map.class);
    }

    /** Chỉ tính khi còn PENDING và có sự kiện đích: sự kiện bị sửa (hoặc đã bị xóa) sau {@code baseUpdatedAt}. */
    private boolean conflictOf(Proposal p) {
        if (p.getStatus() != ProposalStatus.PENDING || p.getTargetId() == null || p.getBaseUpdatedAt() == null) {
            return false;
        }
        return events.find(p.getTargetId())
                .map(ref -> ref.updatedAt().isAfter(p.getBaseUpdatedAt()))
                .orElse(true);
    }
}
