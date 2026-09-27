package vn.giapha.event;

import java.util.List;

import org.springframework.stereotype.Component;

import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.event.entity.EventCalendar;
import vn.giapha.event.service.EventService;

/** API công khai của module event cho module khác (đề xuất Đợt 33, dashboard, AI). */
@Component
public class EventFacade {

    /** Thông tin tối thiểu của một sự kiện chung. */
    public record EventRef(Long id, String title, String description, boolean lunar, int day, int month,
            Integer year, boolean leap) {
    }

    private final EventService service;

    EventFacade(EventService service) {
        this.service = service;
    }

    /** Toàn bộ sự kiện chung, theo id tăng dần. */
    public List<EventRef> list() {
        return service.list().stream().map(EventFacade::toRef).toList();
    }

    private static EventRef toRef(CustomEventResponse r) {
        return new EventRef(r.id(), r.title(), r.description(), r.calendar() == EventCalendar.LUNAR, r.day(),
                r.month(), r.year(), r.leap());
    }
}
