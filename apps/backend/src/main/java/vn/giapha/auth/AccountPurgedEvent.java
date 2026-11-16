package vn.giapha.auth;

/**
 * Admin sắp xóa vĩnh viễn một tài khoản đã xóa mềm, phát <b>đồng bộ trong transaction</b> trước khi xóa dòng
 * {@code user_account}: các module xóa dữ liệu riêng của tài khoản (không có FK nên DB không tự xóa theo).
 */
public record AccountPurgedEvent(Long accountId) {
}
