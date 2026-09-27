package vn.giapha.admin.dto;

import java.util.List;

import vn.giapha.event.dto.CalendarOccurrenceResponse;

/**
 * Tổng quan (IDEA §6.8). {@code pendingAccounts}/{@code pendingProposals}/{@code pendingLinkRequests} chỉ có với
 * Admin ({@code null} với User); {@code pendingProposals} luôn 0 cho tới khi có module đề xuất (Đợt 33).
 */
public record DashboardResponse(
        int totalMembers,
        int living,
        int deceased,
        int onTree,
        int maxGeneration,
        CalendarOccurrenceResponse nextEvent,
        List<CalendarOccurrenceResponse> recentEvents,
        List<CalendarOccurrenceResponse> upcoming30,
        Integer pendingAccounts,
        Integer pendingProposals,
        Integer pendingLinkRequests) {
}
