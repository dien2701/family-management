package vn.giapha.support;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import vn.giapha.auth.mail.MailSender;

/** Bản giả của {@link MailSender} cho test: ghi lại email để lấy OTP, không gửi đi đâu. */
@Component
@Profile("test")
public class RecordingMailSender implements MailSender {

    public record Mail(String to, String subject, String body) {
    }

    private static final Pattern OTP = Pattern.compile("\\b(\\d{6})\\b");

    private final Map<String, List<Mail>> sent = new ConcurrentHashMap<>();

    @Override
    public void send(String to, String subject, String body) {
        sent.computeIfAbsent(to, k -> new CopyOnWriteArrayList<>()).add(new Mail(to, subject, body));
    }

    public List<Mail> mailsTo(String email) {
        return sent.getOrDefault(email, List.of());
    }

    /** OTP trong email gần nhất gửi tới địa chỉ này. */
    public String lastOtp(String email) {
        List<Mail> mails = mailsTo(email);
        if (mails.isEmpty()) {
            throw new IllegalStateException("Chưa có email nào gửi tới " + email);
        }
        Matcher m = OTP.matcher(mails.get(mails.size() - 1).body());
        if (!m.find()) {
            throw new IllegalStateException("Email không chứa OTP");
        }
        return m.group(1);
    }
}
