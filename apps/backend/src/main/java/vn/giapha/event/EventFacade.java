package vn.giapha.event;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.event.dto.EventType;
import vn.giapha.event.entity.EventCalendar;
import vn.giapha.event.service.EventService;
import vn.giapha.event.service.OccurrenceService;

/** API công khai của module event cho module khác (đề xuất Đợt 33, dashboard, AI). */
@Component
public class EventFacade {

    /** Thông tin tối thiểu của một sự kiện chung. */
    public record EventRef(Long id, String title, String description, boolean lunar, int day, int month,
            Integer year, boolean leap) {
    }

    private final EventService service;
    private final OccurrenceService occurrences;

    EventFacade(EventService service, OccurrenceService occurrences) {
        this.service = service;
        this.occurrences = occurrences;
    }

    /** Toàn bộ sự kiện chung, theo id tăng dần. */
    public List<EventRef> list() {
        return service.list().stream().map(EventFacade::toRef).toList();
    }

    /** Sự kiện trong 30 ngày tới, gần nhất trước (dashboard, IDEA §6.8). */
    public List<CalendarOccurrenceResponse> upcoming30() {
        return occurrences.upcoming(30, null, "asc");
    }

    /** 10 sự kiện vừa diễn ra gần nhất (dashboard, IDEA §6.8). */
    public List<CalendarOccurrenceResponse> recent10() {
        return occurrences.recent(10);
    }

    /** Giỗ, sinh nhật và sự kiện chung có ngày dương trong {@code [from, to]}; {@code type = null} là cả ba loại (báo cáo). */
    public List<CalendarOccurrenceResponse> occurrencesBetween(LocalDate from, LocalDate to, EventType type) {
        return occurrences.inRange(from, to, type);
    }

    /** 404 {@code EVENT_NOT_FOUND} khi không có (đề xuất Đợt 33: cần chắc chắn có trước khi ghi nhận). */
    public CustomEventResponse get(Long id) {
        return service.get(id);
    }

    /** Không ném lỗi khi không có (đề xuất Đợt 33: kiểm tra xung đột lúc đọc, sự kiện có thể đã bị xóa). */
    public Optional<CustomEventResponse> find(Long id) {
        return service.findOptional(id);
    }

    /** Cùng quy tắc với {@code POST /api/events} (đề xuất Đợt 33: validate trước khi cho Admin duyệt). */
    public void validate(CustomEventInput input) {
        service.validate(input);
    }

    /** Áp dụng đề xuất CREATE đã được duyệt; cùng quy tắc và audit log với API ghi trực tiếp. */
    public CustomEventResponse create(Long actorId, CustomEventInput input) {
        return service.create(actorId, input);
    }

    /** Áp dụng đề xuất UPDATE đã được duyệt. */
    public CustomEventResponse update(Long actorId, Long id, CustomEventInput input) {
        return service.update(actorId, id, input);
    }

    /** Áp dụng đề xuất DELETE đã được duyệt. */
    public void delete(Long actorId, Long id) {
        service.delete(actorId, id);
    }

    private static EventRef toRef(CustomEventResponse r) {
        return new EventRef(r.id(), r.title(), r.description(), r.calendar() == EventCalendar.LUNAR, r.day(),
                r.month(), r.year(), r.leap());
    }
}
