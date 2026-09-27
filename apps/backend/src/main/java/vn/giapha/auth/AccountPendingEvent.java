package vn.giapha.auth;

/**
 * Một tài khoản vừa xác thực xong và đang chờ Admin duyệt lần đầu (IDEA §9), phát <b>đồng bộ trong transaction</b>
 * để Đợt 34 báo cho mọi Admin. Không phát lại ở các lần đăng nhập sau, chỉ đúng lúc chuyển từ chưa xác thực/chưa có
 * tài khoản sang {@code ACTIVE} lần đầu.
 */
public record AccountPendingEvent(Long accountId) {
}
