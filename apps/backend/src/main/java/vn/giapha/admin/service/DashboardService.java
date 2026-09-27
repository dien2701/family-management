package vn.giapha.admin.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.admin.dto.DashboardResponse;
import vn.giapha.auth.AuthFacade;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.event.EventFacade;
import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.member.MemberFacade;
import vn.giapha.member.MemberFacade.MemberStats;
import vn.giapha.proposal.ProposalFacade;
import vn.giapha.tree.TreeFacade;

/**
 * Tổng quan (IDEA §6.8): thẻ số liệu, sự kiện gần nhất và sắp tới, số hàng đợi chờ duyệt của Admin. Mọi tài khoản đã
 * duyệt xem được; vai trò Admin đọc từ DB nên vừa bị gỡ quyền không còn thấy các số chờ duyệt ngay.
 */
@Service
public class DashboardService {

    private final MemberFacade members;
    private final TreeFacade tree;
    private final EventFacade events;
    private final AuthFacade auth;
    private final ProposalFacade proposals;

    DashboardService(MemberFacade members, TreeFacade tree, EventFacade events, AuthFacade auth,
            ProposalFacade proposals) {
        this.members = members;
        this.tree = tree;
        this.events = events;
        this.auth = auth;
        this.proposals = proposals;
    }

    @Transactional(readOnly = true)
    public DashboardResponse get(Long actorId) {
        AuthFacade.Account account = auth.find(actorId).orElseThrow(() -> new BusinessException(
                HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này."));

        MemberStats memberStats = members.stats();
        TreeFacade.Stats treeStats = tree.stats();
        List<CalendarOccurrenceResponse> upcoming30 = events.upcoming30();
        CalendarOccurrenceResponse nextEvent = upcoming30.isEmpty() ? null : upcoming30.get(0);
        List<CalendarOccurrenceResponse> recentEvents = events.recent10();

        Integer pendingAccounts = null;
        Integer pendingProposals = null;
        Integer pendingLinkRequests = null;
        if (account.admin()) {
            pendingAccounts = (int) auth.pendingAccountCount();
            pendingProposals = (int) proposals.pendingCount();
            pendingLinkRequests = (int) members.pendingLinkRequestCount();
        }

        return new DashboardResponse(memberStats.total(), memberStats.living(), memberStats.deceased(),
                treeStats.onTree(), treeStats.maxGeneration(), nextEvent, recentEvents, upcoming30,
                pendingAccounts, pendingProposals, pendingLinkRequests);
    }
}
