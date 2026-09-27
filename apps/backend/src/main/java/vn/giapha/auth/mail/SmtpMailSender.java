package vn.giapha.auth.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;

/** Gửi qua SMTP, cấu hình bằng {@code MAIL_*}. Không dùng ở dev và test. */
@Component
@Profile("!dev & !test")
class SmtpMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailSender.class);

    private final JavaMailSender mailSender;
    private final AppProperties props;

    SmtpMailSender(JavaMailSender mailSender, AppProperties props) {
        this.mailSender = mailSender;
        this.props = props;
    }

    @Override
    public void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(props.mail().from());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException e) {
            // Không ghi nội dung email (có OTP) vào log
            log.error("Gửi email tới {} thất bại", to, e);
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "MAIL_SEND_FAILED",
                    "Không gửi được email lúc này. Vui lòng thử lại sau.");
        }
    }
}
