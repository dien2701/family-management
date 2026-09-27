package vn.giapha.common.config;

/**
 * Cấu hình hệ thống Admin đổi được lúc chạy (IDEA §6.10; DECISIONS #55, #62), triển khai ở module {@code admin}
 * ({@code system_setting}, cache Caffeine). Đặt cổng này ở {@code common} để module khác (consent, file) dùng được
 * mà không phụ thuộc ngược vào module {@code admin}.
 */
public interface DynamicSettings {

    /** Phiên bản chính sách hiện hành; đổi thì mọi người phải đồng ý lại (DECISIONS #57). */
    int policyVersion();

    int aiQuotaUser();

    int aiQuotaAdmin();

    int uploadMaxMb();

    int totalQuotaMb();

    default long uploadMaxBytes() {
        return uploadMaxMb() * 1024L * 1024L;
    }

    default long totalQuotaBytes() {
        return totalQuotaMb() * 1024L * 1024L;
    }
}
