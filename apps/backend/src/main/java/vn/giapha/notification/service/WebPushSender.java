package vn.giapha.notification.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.concurrent.ExecutionException;

import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;

import vn.giapha.config.AppProperties;

/**
 * Cài đặt {@link PushSender} bằng {@code nl.martijndwars:web-push} (DECISIONS #46). Chưa cấu hình VAPID
 * ({@code app.push.vapid-*} rỗng) thì {@link #send} luôn trả {@code ERROR} mà không ném lỗi, để job vẫn chạy được ở
 * môi trường dev chưa sinh khóa.
 */
@Component
class WebPushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private final AppProperties.Push config;
    private volatile PushService pushService;

    WebPushSender(AppProperties props) {
        this.config = props.push();
    }

    @Override
    public Result send(Target target, String payloadJson) {
        PushService service = pushService();
        if (service == null) {
            return Result.ERROR;
        }
        try {
            Subscription subscription = new Subscription(target.endpoint(),
                    new Subscription.Keys(target.p256dh(), target.auth()));
            HttpResponse response = service.send(new Notification(subscription, payloadJson));
            int status = response.getStatusLine().getStatusCode();
            if (status == 404 || status == 410) {
                return Result.GONE;
            }
            return status >= 200 && status < 300 ? Result.OK : Result.ERROR;
        } catch (GeneralSecurityException | IOException | JoseException | ExecutionException e) {
            log.warn("Gửi push thất bại: {}", e.toString());
            return Result.ERROR;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Result.ERROR;
        }
    }

    private PushService pushService() {
        if (config.vapidPublicKey().isBlank() || config.vapidPrivateKey().isBlank()) {
            return null;
        }
        PushService service = pushService;
        if (service != null) {
            return service;
        }
        synchronized (this) {
            if (pushService == null) {
                try {
                    pushService = new PushService(config.vapidPublicKey(), config.vapidPrivateKey(),
                            config.vapidSubject());
                } catch (GeneralSecurityException e) {
                    log.error("Không khởi tạo được VAPID: {}", e.toString());
                    return null;
                }
            }
            return pushService;
        }
    }
}
