package vn.giapha.proposal;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.proposal.dto.ProposalInput;
import vn.giapha.proposal.entity.ProposalStatus;
import vn.giapha.proposal.repository.ProposalRepository;
import vn.giapha.proposal.service.ProposalService;

/** API công khai của module proposal cho module khác (dashboard, AI, Đợt 32, Đợt 36–37). */
@Component
public class ProposalFacade {

    private final ProposalRepository repository;
    private final ProposalService service;

    ProposalFacade(ProposalRepository repository, ProposalService service) {
        this.repository = repository;
        this.service = service;
    }

    /** Số đề xuất đang chờ Admin duyệt (dashboard, IDEA §6.8). */
    @Transactional(readOnly = true)
    public long pendingCount() {
        return repository.countByStatus(ProposalStatus.PENDING);
    }

    /**
     * Tạo đề xuất sự kiện chung, cùng quy tắc với {@code POST /api/proposals} (AI: {@code submitAiDraft}, DECISIONS
     * #77). @return id đề xuất vừa tạo.
     */
    @Transactional
    public Long create(Long actorId, ProposalInput input) {
        return service.create(actorId, input).id();
    }

    /**
     * Duyệt ngay đề xuất vừa tạo, không chỉnh payload (AI: {@code applyAiDraft}, Admin tự tạo rồi tự duyệt).
     */
    @Transactional
    public void approve(Long actorId, Long proposalId) {
        service.approve(actorId, proposalId, null);
    }
}
