package vn.giapha.notification.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    private static final String DIGEST_LINK = "/thong-bao";

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

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh")
    void run() {
        String currentHour = "%02d:00".formatted(LocalTime.now(clock.withZone(VIETNAM)).getHour());
        List<CalendarOccurrenceResponse> upcoming = events.upcoming30();
        int sent = 0;
        for (Long accountId : accounts.usableAccountIds()) {
            NotificationPref pref = notifications.preference(accountId);
            if (!currentHour.equals(pref.getRemindHour())) {
                continue;
            }
            if (sendDigest(accountId, pref, upcoming)) {
                sent++;
            }
        }
        log.info("DigestJob {}: đã gửi {} bản tin", currentHour, sent);
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

        String body = toSend.stream().map(DigestJob::describe).collect(Collectors.joining("; "));
        if (body.length() > 1000) {
            body = body.substring(0, 997) + "...";
        }
        notifications.notify(accountId, NotificationType.REMINDER_DIGEST, "Nhắc lịch", body, DIGEST_LINK);
        push.sendToAccount(accountId, "Nhắc lịch", body, DIGEST_LINK);
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

    private static String describe(CalendarOccurrenceResponse o) {
        String when = switch (o.daysUntil()) {
            case 0 -> "hôm nay";
            case 1 -> "còn 1 ngày";
            default -> "còn " + o.daysUntil() + " ngày";
        };
        return o.title() + " (" + when + ")";
    }
}
