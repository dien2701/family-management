package vn.giapha.common.security;

/**
 * Trạng thái truy cập của tài khoản, đọc thẳng từ DB. Module auth cài đặt; đặt interface ở đây để {@code common}
 * không phụ thuộc ngược vào auth (Spring Modulith cấm vòng phụ thuộc).
 */
public interface AccountAccessLookup {

    enum Access {
        /** ACTIVE và đã APPROVED. */
        OK,
        /** Chưa xác thực OTP, đang chờ duyệt hoặc bị từ chối. */
        NOT_APPROVED,
        LOCKED,
        /** Tài khoản không còn tồn tại. */
        GONE
    }

    Access accessOf(Long userId);
}
