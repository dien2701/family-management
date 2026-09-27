package vn.giapha.notification.service;

/**
 * Gửi một bản tin Web Push tới một thiết bị đã đăng ký (IDEA §9, DECISIONS #46). Tách interface để có thể đổi cách
 * cài đặt nếu {@code nl.martijndwars:web-push} gặp lỗi phiên bản BouncyCastle.
 */
interface PushSender {

    /** {@code GONE}: subscription không còn hợp lệ (404/410), phải xóa. {@code ERROR}: lỗi tạm thời, giữ lại. */
    enum Result {
        OK, GONE, ERROR
    }

    /** Khóa của một subscription, tách khỏi entity JPA để không kéo tầng service phụ thuộc tầng dữ liệu. */
    record Target(String endpoint, String p256dh, String auth) {
    }

    Result send(Target target, String payloadJson);
}
