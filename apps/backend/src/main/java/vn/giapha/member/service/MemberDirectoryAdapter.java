package vn.giapha.member.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.MemberDirectory;
import vn.giapha.member.LinkDecidedEvent;
import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.entity.Member;
import vn.giapha.member.repository.MemberLinkRequestRepository;
import vn.giapha.member.repository.MemberRepository;

/**
 * Phần của module member mà module auth cần khi Admin quản trị tài khoản (auth không được phụ thuộc ngược vào member
 * nên gọi qua {@link MemberDirectory}): tên thành viên đang liên kết, và việc theo sau khi Admin gán trực tiếp.
 */
@Component
class MemberDirectoryAdapter implements MemberDirectory {

    private final MemberRepository members;
    private final MemberLinkRequestRepository requests;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    MemberDirectoryAdapter(MemberRepository members, MemberLinkRequestRepository requests,
            ApplicationEventPublisher events, Clock clock) {
        this.members = members;
        this.requests = requests;
        this.events = events;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, String> fullNames(Collection<Long> memberIds) {
        if (memberIds.isEmpty()) {
            return Map.of();
        }
        return members.findAllById(memberIds).stream().collect(Collectors.toMap(Member::getId, Member::getFullName));
    }

    /** DECISIONS #80, #81: hủy yêu cầu đang chờ, chép email nếu hồ sơ chưa có, phát event cho thông báo. */
    @Override
    @Transactional
    public void afterAdminLink(Long accountId, String accountEmail, Long memberId, Long actorId) {
        Instant now = Instant.now(clock);
        members.findById(memberId).ifPresent(member -> member.fillEmailIfBlank(accountEmail, now));
        requests.findByAccountIdAndStatus(accountId, LinkRequestStatus.PENDING)
                .forEach(request -> request.decide(LinkRequestStatus.CANCELLED, actorId, now));
        events.publishEvent(new LinkDecidedEvent(accountId, memberId, LinkDecidedEvent.Outcome.ASSIGNED, actorId));
    }
}
