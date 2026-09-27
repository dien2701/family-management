package vn.giapha.auth.dto;

/**
 * Email chỉ gồm ký tự ASCII. {@code @Email} của Hibernate Validator chấp nhận cả Unicode (tên miền IDN,
 * phần local có dấu), nên phải chặn thêm để không có địa chỉ "trông giống" dùng để chiếm tài khoản.
 */
final class EmailRules {

    static final String ASCII_EMAIL = "^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+([.][A-Za-z0-9-]+)*[.][A-Za-z]{2,}$";
    static final String ASCII_EMAIL_MESSAGE = "Email không hợp lệ (chỉ dùng chữ cái không dấu, số và ký tự . _ % + - ').";

    private EmailRules() {
    }
}
