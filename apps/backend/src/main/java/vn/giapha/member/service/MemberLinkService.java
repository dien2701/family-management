package vn.giapha.member.service;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.web.LinkedMember;
import vn.giapha.member.LinkDecidedEvent;
import vn.giapha.member.dto.LinkRequestResponse;
import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.entity.Member;
import vn.giapha.member.entity.MemberLinkRequest;
import vn.giapha.member.repository.MemberLinkRequestRepository;
import vn.giapha.member.repository.MemberRepository;

/**
 * Yêu cầu "Đây là tôi" và hủy liên kết của chính User (IDEA §6.3; DECISIONS #79–#82). Quan hệ tài khoản – thành viên là
 * 1–1; {@code user.member_id} do module auth giữ và đổi qua {@link AuthFacade}. Khi liên kết có hiệu lực, email tài
 * khoản được chép sang hồ sơ nếu hồ sơ chưa có email, trong cùng transaction. Đường Admin gán trực tiếp nằm ở
 * {@code AdminAccountService} và gọi lại phần của module này qua {@code MemberDirectory}.
 */
@Service
public class MemberLinkService {

    private static final String REQUEST_TYPE = "LINK_REQUEST";
    private static final String ACCOUNT_TYPE = "ACCOUNT";

    private final MemberLinkRequestRepository requests;
    private final MemberRepository members;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    MemberLinkService(MemberLinkRequestRepository requests, MemberRepository members, AuthFacade auth,
            AuditLogWriter audit, ApplicationEventPublisher events, Clock clock) {
        this.requests = requests;
        this.members = members;
        this.auth = auth;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    // ---------- Đọc ----------

    /** Hàng đợi của Admin, cũ nhất trước; {@code status} rỗng thì lấy mọi trạng thái. */
    @Transactional(readOnly = true)
    public List<LinkRequestResponse> list(Long actorId, LinkRequestStatus status) {
        requireAdmin(actorId);
        return toResponses(status == null ? requests.findAllByOrderByCreatedAtAscIdAsc()
                : requests.findByStatusOrderByCreatedAtAscIdAsc(status));
    }

    /** Yêu cầu của chính tôi, mới nhất trước, mọi trạng thái. */
    @Transactional(readOnly = true)
    public List<LinkRequestResponse> mine(Long actorId) {
        return toResponses(requests.findByAccountIdOrderByCreatedAtDescIdDesc(actorId));
    }

    // ---------- Ghi ----------

    @Transactional
    public LinkRequestResponse create(Long actorId, Long memberId) {
        // Khóa dòng tài khoản: hai lần bấm gần nhau của cùng một người chạy tuần tự nên không sinh hai yêu cầu chờ
        AuthFacade.Account account = auth.lockAccount(actorId);
        if (!account.usable()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_NOT_APPROVED",
                    "Tài khoản chưa được duyệt nên chưa gửi được yêu cầu.");
        }
        requireMember(memberId);
        if (account.memberId() != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_LINKED",
                    "Tài khoản này đã liên kết với một thành viên. Hãy hủy liên kết cũ trước.");
        }
        if (auth.isMemberLinked(memberId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "MEMBER_ALREADY_LINKED",
                    "Thành viên này đã có tài khoản khác liên kết.");
        }
        if (requests.existsByAccountIdAndStatus(actorId, LinkRequestStatus.PENDING)) {
            throw new BusinessException(HttpStatus.CONFLICT, "LINK_REQUEST_EXISTS",
                    "Bạn đã gửi yêu cầu và đang chờ Admin duyệt. Hãy chờ kết quả hoặc nhờ Admin từ chối để gửi lại.");
        }
        MemberLinkRequest request = requests.save(new MemberLinkRequest(actorId, memberId, Instant.now(clock)));
        audit.write(actorId, "CREATE", REQUEST_TYPE, request.getId(), null, snapshot(request, null));
        return toResponses(List.of(request)).get(0);
    }

    /**
     * Duyệt: gán {@code user.member_id}, chép email nếu hồ sơ chưa có, phát {@link LinkDecidedEvent}. Chỉ duyệt được khi
     * tài khoản còn ACTIVE + APPROVED (như khi Admin gán trực tiếp).
     */
    @Transactional
    public LinkRequestResponse approve(Long actorId, Long requestId) {
        requireAdmin(actorId);
        // Khóa tài khoản trước rồi mới khóa yêu cầu: cùng thứ tự với Admin gán trực tiếp nên không deadlock
        auth.lockAccount(requests.findAccountIdById(requestId).orElseThrow(this::notFound));
        MemberLinkRequest request = findForUpdate(requestId);
        requirePending(request);
        Member member = requireMember(request.getMemberId());

        AuthFacade.Account account = auth.linkMember(request.getAccountId(), request.getMemberId());
        Instant now = Instant.now(clock);
        boolean emailCopied = member.fillEmailIfBlank(account.email(), now);

        Map<String, Object> before = snapshot(request, null);
        request.decide(LinkRequestStatus.APPROVED, actorId, now);
        audit.write(actorId, "APPROVE", REQUEST_TYPE, request.getId(), before, snapshot(request, emailCopied));
        events.publishEvent(new LinkDecidedEvent(request.getAccountId(), request.getMemberId(),
                LinkDecidedEvent.Outcome.APPROVED, actorId));
        return toResponses(List.of(request)).get(0);
    }

    @Transactional
    public LinkRequestResponse reject(Long actorId, Long requestId) {
        requireAdmin(actorId);
        MemberLinkRequest request = findForUpdate(requestId);
        requirePending(request);

        Map<String, Object> before = snapshot(request, null);
        request.decide(LinkRequestStatus.REJECTED, actorId, Instant.now(clock));
        audit.write(actorId, "REJECT", REQUEST_TYPE, request.getId(), before, snapshot(request, null));
        events.publishEvent(new LinkDecidedEvent(request.getAccountId(), request.getMemberId(),
                LinkDecidedEvent.Outcome.REJECTED, actorId));
        return toResponses(List.of(request)).get(0);
    }

    /** User tự hủy liên kết của mình; email đã chép sang hồ sơ giữ nguyên. 409 {@code NOT_LINKED} khi chưa liên kết. */
    @Transactional
    public void unlinkMe(Long actorId) {
        Long memberId = auth.lockAccount(actorId).memberId();
        auth.unlinkMember(actorId);
        audit.write(actorId, "UNLINK_MEMBER", ACCOUNT_TYPE, actorId, memberSnapshot(memberId), memberSnapshot(null));
    }

    // ---------- Nội bộ ----------

    private MemberLinkRequest findForUpdate(Long id) {
        return requests.findByIdForUpdate(id).orElseThrow(this::notFound);
    }

    private BusinessException notFound() {
        return new BusinessException(HttpStatus.NOT_FOUND, "LINK_REQUEST_NOT_FOUND",
                "Không tìm thấy yêu cầu liên kết này.");
    }

    private static void requirePending(MemberLinkRequest request) {
        if (!request.isPending()) {
            throw new BusinessException(HttpStatus.CONFLICT, "LINK_REQUEST_NOT_PENDING",
                    "Yêu cầu này đã được xử lý rồi. Danh sách đã được tải lại.");
        }
    }

    private Member requireMember(Long id) {
        return members.findById(id).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên."));
    }

    /** Vai trò Admin đọc từ DB, không tin claim. */
    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).filter(AuthFacade.Account::usable).map(AuthFacade.Account::admin)
                .orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }

    private static Map<String, Object> snapshot(MemberLinkRequest r, Boolean emailCopied) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("accountId", r.getAccountId());
        m.put("memberId", r.getMemberId());
        m.put("status", r.getStatus());
        if (emailCopied != null) {
            m.put("emailCopied", emailCopied);
        }
        return m;
    }

    /** Chỉ {@code memberId}; không có email hay bí mật của tài khoản. */
    private static Map<String, Object> memberSnapshot(Long memberId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("memberId", memberId);
        return m;
    }

    /** Họ tên và email tài khoản, họ tên thành viên: đọc một lần cho cả danh sách. */
    private List<LinkRequestResponse> toResponses(List<MemberLinkRequest> rows) {
        Map<Long, AuthFacade.Account> accounts = auth
                .findAll(rows.stream().map(MemberLinkRequest::getAccountId).distinct().toList()).stream()
                .collect(Collectors.toMap(AuthFacade.Account::id, Function.identity()));
        Map<Long, Member> memberById = members
                .findAllById(rows.stream().map(MemberLinkRequest::getMemberId).distinct().toList()).stream()
                .collect(Collectors.toMap(Member::getId, Function.identity()));
        return rows.stream().map(r -> {
            AuthFacade.Account account = accounts.get(r.getAccountId());
            Member member = memberById.get(r.getMemberId());
            return new LinkRequestResponse(r.getId(), r.getAccountId(),
                    account == null ? "" : account.fullName(), account == null ? "" : account.email(),
                    new LinkedMember(r.getMemberId(), member == null ? "" : member.getFullName()),
                    r.getStatus(), r.getCreatedAt(), r.getDecidedAt());
        }).toList();
    }
}
