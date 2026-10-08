package vn.giapha.notification.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.nio.charset.StandardCharsets;
import java.security.Security;
import java.util.concurrent.ExecutionException;

import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Urgency;

import vn.giapha.config.AppProperties;

/**
 * Cài đặt {@link PushSender} bằng {@code nl.martijndwars:web-push} (DECISIONS #46). Chưa cấu hình VAPID
 * ({@code app.push.vapid-*} rỗng) thì {@link #send} luôn trả {@code ERROR} mà không ném lỗi, để job vẫn chạy được ở
 * môi trường dev chưa sinh khóa.
 */
@Component
class WebPushSender implements PushSender {

    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);
    private static final int TTL_SECONDS = 12 * 60 * 60;

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
            // aes128gcm là bản chuẩn RFC 8291, bắt buộc với Safari/iOS (aesgcm cũ bị Apple từ chối).
            // TTL ngắn: nhắc lịch "hôm nay" mà tới trễ vài ngày sau khi máy bật lại thì sai; urgency cao để máy đang ngủ vẫn nhận.
            Notification notification = Notification.builder().endpoint(target.endpoint())
                    .userPublicKey(target.p256dh()).userAuth(target.auth()).payload(payloadJson.getBytes(StandardCharsets.UTF_8))
                    .ttl(TTL_SECONDS).urgency(Urgency.HIGH).build();
            HttpResponse response = service.send(notification, Encoding.AES128GCM);
            int status = response.getStatusLine().getStatusCode();
            if (status == 404 || status == 410) {
                return Result.GONE;
            }
            if (status < 200 || status >= 300) {
                // 401/403 thường là sai khóa VAPID; không ghi log thì push hỏng mà không ai biết
                log.warn("Push service từ chối: HTTP {} ({})", status, hostOf(target.endpoint()));
                return Result.ERROR;
            }
            return Result.OK;
        } catch (GeneralSecurityException | IOException | JoseException | ExecutionException e) {
            log.warn("Gửi push thất bại: {}", e.toString());
            return Result.ERROR;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Result.ERROR;
        }
    }

    private static String hostOf(String endpoint) {
        try {
            return java.net.URI.create(endpoint).getHost();
        } catch (IllegalArgumentException e) {
            return "?";
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
