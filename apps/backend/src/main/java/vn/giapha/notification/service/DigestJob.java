package vn.giapha.notification.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AuthFacade;
import vn.giapha.event.EventFacade;
import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.dto.EventType;
import vn.giapha.notification.entity.NotificationDispatch;
import vn.giapha.notification.entity.NotificationPref;
import vn.giapha.notification.entity.NotificationType;
import vn.giapha.notification.repository.NotificationDispatchRepository;

/**
 * Gộp giỗ, sinh nhật và sự kiện chung sắp tới thành một bản tin mỗi giờ (IDEA §9 mục 4). Chạy mỗi giờ, chỉ xử lý
 * tài khoản có {@code remindHour} đúng bằng giờ hiện tại (giờ Việt Nam); mốc và loại đã tắt bị loại khỏi bản tin,
 * bản tin rỗng thì không gửi. {@link NotificationDispatchRepository} chống gửi trùng nếu job chạy lại cùng giờ.
 */
@Component
class DigestJob {

    private static final Logger log = LoggerFactory.getLogger(DigestJob.class);
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String DIGEST_LINK = "/lich";

    private final AuthFacade accounts;
    private final EventFacade events;
    private final NotificationService notifications;
    private final NotificationDispatchRepository dispatches;
    private final PushSubscriptionService push;
    private final Clock clock;

    DigestJob(AuthFacade accounts, EventFacade events, NotificationService notifications,
            NotificationDispatchRepository dispatches, PushSubscriptionService push, Clock clock) {
        this.accounts = accounts;
        this.events = events;
        this.notifications = notifications;
        this.dispatches = dispatches;
        this.push = push;
        this.clock = clock;
    }

    /**
     * Chạy mỗi phút để giờ nhắc có phút (ví dụ 12:17) được gửi đúng phút: chỉ xử lý tài khoản đã chọn đúng giờ:phút này.
     * Đầu mỗi giờ quét thêm mọi tài khoản có giờ nhắc đã qua trong ngày (kể cả mặc định chưa có dòng cài đặt), để bù khi
     * máy chủ tắt hoặc job lỗi; bảng dispatch chặn gửi trùng.
     */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        LocalTime now = LocalTime.now(clock.withZone(VIETNAM));
        String hhmm = "%02d:%02d".formatted(now.getHour(), now.getMinute());
        boolean sweep = now.getMinute() == 0;
        Collection<Long> due = sweep ? accounts.usableAccountIds() : notifications.accountIdsRemindingAt(hhmm);
        if (due.isEmpty()) {
            return;
        }
        Collection<Long> usable = sweep ? due : new HashSet<>(accounts.usableAccountIds());
        List<CalendarOccurrenceResponse> upcoming = events.upcoming30();
        int sent = 0;
        for (Long accountId : due) {
            if (!usable.contains(accountId)) {
                continue;
            }
            NotificationPref pref = notifications.preference(accountId);
            // sweep dùng >=; các phút còn lại chỉ có tài khoản khớp đúng giờ:phút nên điều kiện luôn đúng
            if (hhmm.compareTo(pref.getRemindHour()) < 0) {
                continue;
            }
            if (sendDigest(accountId, pref, upcoming)) {
                sent++;
            }
        }
        log.info("DigestJob {}: đã gửi {} bản tin", hhmm, sent);
    }

    private boolean sendDigest(Long accountId, NotificationPref pref, List<CalendarOccurrenceResponse> upcoming) {
        List<Integer> remindDays = notifications.parseRemindDays(pref.getRemindDaysBefore());
        List<CalendarOccurrenceResponse> matched = upcoming.stream()
                .filter(o -> typeEnabled(pref, o.type()))
                .filter(o -> remindDays.contains(o.daysUntil()))
                .toList();
        if (matched.isEmpty()) {
            return false;
        }

        Instant now = Instant.now(clock);
        List<CalendarOccurrenceResponse> toSend = new ArrayList<>();
        for (CalendarOccurrenceResponse o : matched) {
            LocalDate occurrenceDate = toLocalDate(o);
            if (!dispatches.existsByAccountIdAndEventKeyAndOccurrenceDateAndDaysBefore(accountId, o.eventKey(),
                    occurrenceDate, o.daysUntil())) {
                toSend.add(o);
            }
        }
        if (toSend.isEmpty()) {
            return false;
        }

        DigestFormatter.Message message = DigestFormatter.format(toSend);
        notifications.notify(accountId, NotificationType.REMINDER_DIGEST, message.title(), message.body(), DIGEST_LINK);
        push.sendToAccount(accountId, message.title(), message.body(), DIGEST_LINK);
        for (CalendarOccurrenceResponse o : toSend) {
            dispatches.save(new NotificationDispatch(accountId, o.eventKey(), toLocalDate(o), o.daysUntil(), now));
        }
        return true;
    }

    private static boolean typeEnabled(NotificationPref pref, EventType type) {
        return type == EventType.MEMORIAL ? pref.isNotifyMemorials() : pref.isNotifyEvents();
    }

    private static LocalDate toLocalDate(CalendarOccurrenceResponse o) {
        return LocalDate.of(o.solar().year(), o.solar().month(), o.solar().day());
    }
}
