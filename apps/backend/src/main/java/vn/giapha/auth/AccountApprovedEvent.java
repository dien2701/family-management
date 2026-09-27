package vn.giapha.auth;

/**
 * Admin vừa duyệt một tài khoản (IDEA §9), phát <b>đồng bộ trong transaction</b> của thao tác duyệt để Đợt 34 báo
 * cho chính tài khoản đó.
 */
public record AccountApprovedEvent(Long accountId) {
}
