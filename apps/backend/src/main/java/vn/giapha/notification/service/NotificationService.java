package vn.giapha.notification.service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.web.SimplePage;
import vn.giapha.notification.dto.NotificationPrefResponse;
import vn.giapha.notification.dto.NotificationResponse;
import vn.giapha.notification.entity.Notification;
import vn.giapha.notification.entity.NotificationPref;
import vn.giapha.notification.entity.NotificationType;
import vn.giapha.notification.repository.NotificationPrefRepository;
import vn.giapha.notification.repository.NotificationRepository;

/**
 * Hộp thư và tùy chọn thông báo (IDEA §9). {@code create(...)} được các listener của module này gọi đồng bộ trong
 * transaction của thao tác phát sinh ra thông báo (duyệt tài khoản, quyết định liên kết, đề xuất...).
 */
@Service
public class NotificationService {

    /** Mặc định khi tài khoản chưa từng đặt tùy chọn (IDEA §9 mục 4: giờ nhận mặc định 7h). */
    private static final List<Integer> DEFAULT_REMIND_DAYS = List.of(30, 7, 3, 1, 0);
    private static final String DEFAULT_REMIND_HOUR = "07:00";

    private final NotificationRepository notifications;
    private final NotificationPrefRepository prefs;
    private final JsonMapper json;
    private final Clock clock;

    NotificationService(NotificationRepository notifications, NotificationPrefRepository prefs, JsonMapper json,
            Clock clock) {
        this.notifications = notifications;
        this.prefs = prefs;
        this.json = json;
        this.clock = clock;
    }

    // ---------- Hộp thư ----------

    @Transactional(readOnly = true)
    public SimplePage<NotificationResponse> inbox(Long accountId, int page, int size) {
        Page<Notification> result = notifications.findAllByAccountIdOrderByCreatedAtDesc(accountId,
                PageRequest.of(Math.max(page - 1, 0), size, Sort.by(Sort.Order.desc("createdAt"))));
        return SimplePage.of(result, NotificationService::toResponse);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long accountId) {
        return notifications.countByAccountIdAndReadFalse(accountId);
    }

    /** Mỗi người chỉ đọc được thông báo của chính mình (security.md). */
    @Transactional
    public void markRead(Long accountId, Long id) {
        Notification n = notifications.findById(id)
                .filter(x -> x.getAccountId().equals(accountId))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND",
                        "Không tìm thấy thông báo này."));
        n.markRead();
    }

    @Transactional
    public void markAllRead(Long accountId) {
        notifications.markAllRead(accountId);
    }

    // ---------- Tùy chọn ----------

    @Transactional
    public NotificationPrefResponse getPreferences(Long accountId) {
        return toResponse(ensurePref(accountId));
    }

    @Transactional
    public NotificationPrefResponse updatePreferences(Long accountId, NotificationPrefResponse input) {
        NotificationPref pref = ensurePref(accountId);
        pref.apply(input.notifyEvents(), input.notifyMemorials(), input.notifyProposals(),
                json.writeValueAsString(input.remindDaysBefore()), input.remindHour(), Instant.now(clock));
        return toResponse(pref);
    }

    /** Tạo lười với giá trị mặc định nếu tài khoản chưa từng đọc/đặt tùy chọn. */
    private NotificationPref ensurePref(Long accountId) {
        return prefs.findById(accountId).orElseGet(() -> prefs.save(new NotificationPref(accountId, true, true, true,
                json.writeValueAsString(DEFAULT_REMIND_DAYS), DEFAULT_REMIND_HOUR, Instant.now(clock))));
    }

    private NotificationPrefResponse toResponse(NotificationPref pref) {
        List<Integer> days = List.of(json.readValue(pref.getRemindDaysBefore(), Integer[].class));
        return new NotificationPrefResponse(pref.isNotifyEvents(), pref.isNotifyMemorials(),
                pref.isNotifyProposals(), days, pref.getRemindHour());
    }

    // ---------- Tạo thông báo (nội bộ module, gọi từ các listener) ----------

    /** {@code notifyProposals = false} thì bỏ qua thông báo về đề xuất; các loại khác luôn gửi. */
    @Transactional
    void notify(Long accountId, NotificationType type, String title, String body, String link) {
        if (isProposalType(type) && !ensurePref(accountId).isNotifyProposals()) {
            return;
        }
        notifications.save(new Notification(accountId, type, title, body, link, Instant.now(clock)));
    }

    private static boolean isProposalType(NotificationType type) {
        return type == NotificationType.PROPOSAL_NEW || type == NotificationType.PROPOSAL_APPROVED
                || type == NotificationType.PROPOSAL_REJECTED;
    }

    private static NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType().name(), n.getTitle(), n.getBody(), n.getLink(),
                n.isRead(), n.getCreatedAt());
    }
}
