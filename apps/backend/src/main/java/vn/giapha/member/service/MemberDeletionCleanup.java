package vn.giapha.member.service;

import java.time.Clock;
import java.time.Instant;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AuthFacade;
import vn.giapha.member.MemberDeletedEvent;
import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.repository.MemberLinkRequestRepository;
import vn.giapha.member.repository.MemberRelativeRepository;

/**
 * Dọn dữ liệu của người thân và liên kết khi một thành viên bị xóa (DECISIONS #62). Nghe {@link MemberDeletedEvent}
 * đồng bộ trong transaction xóa, sau khi snapshot đã ghi vào audit log: xóa các dòng người thân ở cả hai phía, hủy
 * yêu cầu liên kết đang chờ và gỡ {@code user.member_id}. Tài khoản vẫn còn.
 */
@Component
class MemberDeletionCleanup {

    private final MemberRelativeRepository relatives;
    private final MemberLinkRequestRepository requests;
    private final AuthFacade auth;
    private final Clock clock;

    MemberDeletionCleanup(MemberRelativeRepository relatives, MemberLinkRequestRepository requests, AuthFacade auth,
            Clock clock) {
        this.relatives = relatives;
        this.requests = requests;
        this.auth = auth;
        this.clock = clock;
    }

    @EventListener
    void on(MemberDeletedEvent event) {
        Long memberId = event.memberId();
        relatives.deleteAllInvolving(memberId);
        Instant now = Instant.now(clock);
        requests.findByMemberIdAndStatus(memberId, LinkRequestStatus.PENDING)
                .forEach(request -> request.decide(LinkRequestStatus.CANCELLED, event.actorId(), now));
        auth.detachMember(memberId);
    }
}
