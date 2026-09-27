package vn.giapha.auth.mail;

/**
 * Cổng gửi email (DECISIONS #21). Dev in ra log ({@link ConsoleMailSender}), prod gửi SMTP ({@link SmtpMailSender});
 * đổi nhà cung cấp chỉ cần thêm một bản cài đặt.
 */
public interface MailSender {

    /** Ném {@link vn.giapha.common.exception.BusinessException} (502 MAIL_SEND_FAILED) khi không gửi được. */
    void send(String to, String subject, String body);
}
