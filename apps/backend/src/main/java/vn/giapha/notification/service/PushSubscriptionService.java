package vn.giapha.notification.service;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.common.security.RateLimiter;
import vn.giapha.config.AppProperties;
import vn.giapha.notification.dto.GuestPushPref;
import vn.giapha.notification.dto.GuestPushRequest;
import vn.giapha.notification.dto.PushSubscribeRequest;
import vn.giapha.notification.entity.PushSubscription;
import vn.giapha.notification.repository.NotificationDispatchRepository;
import vn.giapha.notification.repository.PushSubscriptionRepository;

/**
 * Đăng ký thiết bị và gửi Web Push (IDEA §9, DECISIONS #46, #89). Dùng chung cho API {@code /api/push/*} và
 * {@link DigestJob}. Subscription có {@code accountId} NULL là của khách, được nhận diện bằng chính {@code endpoint}.
 */
@Service
public class PushSubscriptionService {

    private record Payload(String title, String body, String tag, String url) {
    }

    /** API khách không cần đăng nhập nên giới hạn theo IP (bucket4j, DECISIONS #19). */
    private static final RateLimiter.Policy GUEST_POLICY = new RateLimiter.Policy("push-guest-ip", 30,
            Duration.ofMinutes(1));
    private static final int MAX_USER_AGENT = 255;

    private final PushSubscriptionRepository subscriptions;
    private final NotificationDispatchRepository dispatches;
    private final PushSender sender;
    private final RateLimiter rateLimiter;
    private final AppProperties props;
    private final JsonMapper json;
    private final Clock clock;

    PushSubscriptionService(PushSubscriptionRepository subscriptions, NotificationDispatchRepository dispatches,
            PushSender sender, RateLimiter rateLimiter, AppProperties props, JsonMapper json, Clock clock) {
        this.subscriptions = subscriptions;
        this.dispatches = dispatches;
        this.sender = sender;
        this.rateLimiter = rateLimiter;
        this.props = props;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public String publicKey() {
        requireConfigured();
        return props.push().vapidPublicKey();
    }

    /** Tài khoản đã đăng nhập đăng ký; endpoint đang là khách thì chuyển sang tài khoản này (DECISIONS #89). */
    @Transactional
    public void subscribe(Long accountId, PushSubscribeRequest input, String userAgent) {
        requireConfigured();
        subscriptions.findByEndpoint(input.endpoint())
                .map(existing -> {
                    existing.reassign(accountId, input.keys().p256dh(), input.keys().auth(), clip(userAgent));
                    return existing;
                })
                .orElseGet(() -> subscriptions.save(new PushSubscription(accountId, input.endpoint(),
                        input.keys().p256dh(), input.keys().auth(), clip(userAgent), Instant.now(clock))));
    }

    @Transactional
    public void unsubscribe(Long accountId, String endpoint) {
        subscriptions.findByEndpoint(endpoint)
                .filter(s -> accountId.equals(s.getAccountId()))
                .ifPresent(this::delete);
    }

    /**
     * Đăng xuất: subscription của thiết bị này về lại khách với tùy chọn mặc định, không hủy push. Không có hoặc không
     * phải của tài khoản này thì không làm gì, để không lộ endpoint nào có thật.
     */
    @Transactional
    public void releaseToGuest(Long accountId, String endpoint) {
        subscriptions.findByEndpoint(endpoint)
                .filter(s -> accountId.equals(s.getAccountId()))
                .ifPresent(PushSubscription::releaseToGuest);
    }

    // ---------- Khách (DECISIONS #89) ----------

    /** Đăng ký hoặc cập nhật; {@code pref} trống thì giữ tùy chọn hiện có. */
    @Transactional
    public GuestPushPref guestUpsert(GuestPushRequest input, String userAgent, String clientIp) {
        limit(clientIp);
        requireConfigured();
        requirePushServiceUrl(input.endpoint());
        if (input.pref() != null) {
            requireDistinct(input.pref());
        }
        PushSubscription sub = subscriptions.findByEndpoint(input.endpoint()).orElse(null);
        if (sub != null && !sub.isGuest()) {
            throw notFound();
        }
        if (sub == null) {
            sub = subscriptions.save(new PushSubscription(null, input.endpoint(), input.keys().p256dh(),
                    input.keys().auth(), clip(userAgent), Instant.now(clock)));
        } else {
            sub.rotateKeys(input.keys().p256dh(), input.keys().auth(), clip(userAgent));
        }
        GuestPushPref pref = input.pref();
        if (pref != null) {
            sub.applyGuestPref(pref.notifyEvents(), pref.notifyMemorials(),
                    json.writeValueAsString(pref.remindDaysBefore()), pref.remindHour());
        }
        return toPref(sub);
    }

    /** POST (không phải GET) để endpoint không nằm trên URL và không vào log truy cập. */
    @Transactional(readOnly = true)
    public GuestPushPref guestLookup(String endpoint, String clientIp) {
        limit(clientIp);
        return subscriptions.findByEndpoint(endpoint)
                .filter(PushSubscription::isGuest)
                .map(this::toPref)
                .orElseThrow(PushSubscriptionService::notFound);
    }

    @Transactional
    public void guestUnsubscribe(String endpoint, String clientIp) {
        limit(clientIp);
        subscriptions.findByEndpoint(endpoint).filter(PushSubscription::isGuest).ifPresent(this::delete);
    }

    /** Subscription khách đến giờ nhận; đầu giờ ({@code sweep}) lấy cả những giờ đã qua để bù khi máy chủ tắt. */
    @Transactional(readOnly = true)
    List<PushSubscription> guestsDueAt(String hhmm, boolean sweep) {
        if (!sweep) {
            return subscriptions.findByAccountIdIsNullAndRemindHour(hhmm);
        }
        return subscriptions.findByAccountIdIsNull().stream()
                .filter(s -> hhmm.compareTo(s.getRemindHour()) >= 0)
                .toList();
    }

    GuestPushPref toPref(PushSubscription sub) {
        return new GuestPushPref(sub.isNotifyEvents(), sub.isNotifyMemorials(),
                List.of(json.readValue(sub.getRemindDaysBefore(), Integer[].class)), sub.getRemindHour());
    }

    // ---------- Gửi ----------

    /** 404 {@code PUSH_NOT_SUBSCRIBED} khi thiết bị này chưa đăng ký (Cài đặt > nút "Gửi thử"). */
    @Transactional
    public void sendTest(Long accountId) {
        requireConfigured();
        List<PushSubscription> subs = subscriptions.findAllByAccountId(accountId);
        if (subs.isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "PUSH_NOT_SUBSCRIBED",
                    "Thiết bị này chưa đăng ký nhận thông báo.");
        }
        String payload = json.writeValueAsString(
                new Payload("Thử thông báo", "Thông báo đẩy đang hoạt động trên thiết bị này.", "test", null));
        if (dispatchAll(subs, payload) == 0) {
            // Trước đây luôn trả 200 dù không gửi được, nên nút "Gửi thử" báo thành công giả
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "PUSH_DELIVERY_FAILED",
                    "Không gửi được thông báo tới thiết bị. Hãy bật lại thông báo trên thiết bị này rồi thử lại.");
        }
    }

    /** Gọi từ {@link DigestJob}; không báo lỗi nếu tài khoản chưa đăng ký thiết bị nào. */
    void sendToAccount(Long accountId, String title, String body, String link) {
        List<PushSubscription> subs = subscriptions.findAllByAccountId(accountId);
        if (subs.isEmpty() || props.push().vapidPublicKey().isBlank()) {
            return;
        }
        String payload = json.writeValueAsString(new Payload(title, body, "digest", link));
        dispatchAll(subs, payload);
    }

    /** Gọi từ {@link DigestJob} cho thiết bị khách. @return true nếu thiết bị nhận được (job mới ghi dispatch). */
    boolean sendToSubscription(PushSubscription sub, String title, String body, String link) {
        if (props.push().vapidPublicKey().isBlank()) {
            return false;
        }
        String payload = json.writeValueAsString(new Payload(title, body, "digest", link));
        return dispatchAll(List.of(sub), payload) > 0;
    }

    /** Trả số thiết bị nhận được. */
    private int dispatchAll(List<PushSubscription> subs, String payload) {
        Instant now = Instant.now(clock);
        int delivered = 0;
        for (PushSubscription sub : subs) {
            PushSender.Result result = sender
                    .send(new PushSender.Target(sub.getEndpoint(), sub.getP256dh(), sub.getAuthKey()), payload);
            switch (result) {
                case OK -> {
                    sub.markOk(now);
                    // sendToAccount (gọi từ DigestJob) không nằm trong transaction nên phải lưu rõ ràng
                    subscriptions.save(sub);
                    delivered++;
                }
                case GONE -> delete(sub);
                case ERROR -> {
                    // Lỗi tạm thời (mạng, quota...): giữ subscription, thử lại ở lần gửi sau.
                }
            }
        }
        return delivered;
    }

    private void delete(PushSubscription sub) {
        dispatches.deleteBySubscriptionId(sub.getId());
        subscriptions.delete(sub);
    }

    // ---------- Kiểm tra ----------

    private void limit(String clientIp) {
        rateLimiter.acquireOrThrow(GUEST_POLICY, clientIp, "RATE_LIMITED",
                "Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây.");
    }

    private void requireConfigured() {
        if (props.push().vapidPublicKey().isBlank() || props.push().vapidPrivateKey().isBlank()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PUSH_NOT_CONFIGURED",
                    "Thông báo đẩy chưa được cấu hình.");
        }
    }

    /**
     * Khách tự đưa endpoint lên và máy chủ sẽ gọi tới đó, nên chỉ nhận https tới tên miền (push service của trình
     * duyệt luôn như vậy), tránh bị lợi dụng gọi vào địa chỉ nội bộ.
     */
    private static void requirePushServiceUrl(String endpoint) {
        String host = null;
        try {
            URI uri = URI.create(endpoint);
            if ("https".equalsIgnoreCase(uri.getScheme())) {
                host = uri.getHost();
            }
        } catch (IllegalArgumentException ignored) {
            // host giữ null: báo lỗi bên dưới
        }
        boolean ok = host != null && host.contains(".") && !host.contains(":")
                && !host.matches("[0-9.]+") && !host.endsWith(".local") && !host.endsWith(".internal");
        if (!ok) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.",
                    List.of(new FieldError("endpoint", "Endpoint không hợp lệ.")));
        }
    }

    private static void requireDistinct(GuestPushPref pref) {
        if (new HashSet<>(pref.remindDaysBefore()).size() != pref.remindDaysBefore().size()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.",
                    List.of(new FieldError("remindDaysBefore", "Các mốc nhắc không được trùng nhau.")));
        }
    }

    private static BusinessException notFound() {
        return new BusinessException(HttpStatus.NOT_FOUND, "PUSH_SUBSCRIPTION_NOT_FOUND",
                "Thiết bị này chưa đăng ký nhận thông báo.");
    }

    private static String clip(String userAgent) {
        return userAgent == null || userAgent.length() <= MAX_USER_AGENT ? userAgent
                : userAgent.substring(0, MAX_USER_AGENT);
    }
}
