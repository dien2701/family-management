package vn.giapha.proposal;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.proposal.entity.ProposalStatus;
import vn.giapha.proposal.repository.ProposalRepository;

/** API công khai của module proposal cho module khác (dashboard, Đợt 32). */
@Component
public class ProposalFacade {

    private final ProposalRepository repository;

    ProposalFacade(ProposalRepository repository) {
        this.repository = repository;
    }

    /** Số đề xuất đang chờ Admin duyệt (dashboard, IDEA §6.8). */
    @Transactional(readOnly = true)
    public long pendingCount() {
        return repository.countByStatus(ProposalStatus.PENDING);
    }
}
