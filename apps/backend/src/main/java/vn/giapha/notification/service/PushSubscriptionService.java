package vn.giapha.notification.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;
import vn.giapha.notification.dto.PushSubscribeRequest;
import vn.giapha.notification.entity.PushSubscription;
import vn.giapha.notification.repository.PushSubscriptionRepository;

/** Đăng ký thiết bị và gửi Web Push (IDEA §9, DECISIONS #46). Dùng chung cho API `/api/push/*` và {@link DigestJob}. */
@Service
public class PushSubscriptionService {

    private record Payload(String title, String body, String tag, String url) {
    }

    private final PushSubscriptionRepository subscriptions;
    private final PushSender sender;
    private final AppProperties props;
    private final JsonMapper json;
    private final Clock clock;

    PushSubscriptionService(PushSubscriptionRepository subscriptions, PushSender sender, AppProperties props,
            JsonMapper json, Clock clock) {
        this.subscriptions = subscriptions;
        this.sender = sender;
        this.props = props;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public String publicKey() {
        requireConfigured();
        return props.push().vapidPublicKey();
    }

    @Transactional
    public void subscribe(Long accountId, PushSubscribeRequest input, String userAgent) {
        requireConfigured();
        subscriptions.findByEndpoint(input.endpoint())
                .map(existing -> {
                    existing.reassign(accountId, input.keys().p256dh(), input.keys().auth(), userAgent);
                    return existing;
                })
                .orElseGet(() -> subscriptions.save(new PushSubscription(accountId, input.endpoint(),
                        input.keys().p256dh(), input.keys().auth(), userAgent, Instant.now(clock))));
    }

    @Transactional
    public void unsubscribe(Long accountId, String endpoint) {
        subscriptions.deleteByAccountIdAndEndpoint(accountId, endpoint);
    }

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
                case GONE -> subscriptions.delete(sub);
                case ERROR -> {
                    // Lỗi tạm thời (mạng, quota...): giữ subscription, thử lại ở lần gửi sau.
                }
            }
        }
        return delivered;
    }

    private void requireConfigured() {
        if (props.push().vapidPublicKey().isBlank() || props.push().vapidPrivateKey().isBlank()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "PUSH_NOT_CONFIGURED",
                    "Thông báo đẩy chưa được cấu hình.");
        }
    }
}
