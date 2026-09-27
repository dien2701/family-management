package vn.giapha.proposal.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.proposal.entity.Proposal;
import vn.giapha.proposal.entity.ProposalStatus;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    Page<Proposal> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Proposal> findAllByStatusOrderByCreatedAtDesc(ProposalStatus status, Pageable pageable);

    Page<Proposal> findAllByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    long countByStatus(ProposalStatus status);
}
