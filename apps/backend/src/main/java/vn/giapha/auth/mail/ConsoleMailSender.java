package vn.giapha.auth.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Chỉ dùng ở profile dev: in nội dung email (kèm OTP) ra log thay vì gửi thật. */
@Component
@Profile("dev")
class ConsoleMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(ConsoleMailSender.class);

    @Override
    public void send(String to, String subject, String body) {
        log.info("\n=== EMAIL (console) ===\nTo: {}\nSubject: {}\n{}\n=======================", to, subject, body);
    }
}
