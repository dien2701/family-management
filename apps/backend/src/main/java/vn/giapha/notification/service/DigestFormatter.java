package vn.giapha.notification.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.dto.EventType;

/**
 * Soạn tiêu đề và nội dung bản tin nhắc lịch (chung cho thông báo trong app và Web Push). Giỗ ghi ngày âm trước,
 * sự kiện và sinh nhật ghi ngày dương trước; luôn kèm ngày của lịch còn lại để không phải tự quy đổi.
 */
final class DigestFormatter {

    record Message(String title, String body) {
    }

    private static final String[] WEEKDAY = {"Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"};
    private static final int MAX_BODY = 1000;

    private DigestFormatter() {
    }

    static Message format(List<CalendarOccurrenceResponse> items) {
        if (items.size() == 1) {
            CalendarOccurrenceResponse o = items.get(0);
            return new Message(headline(o) + " — " + when(o), clip(dateLine(o)));
        }
        String body = items.stream()
                .map(o -> "• " + headline(o) + " — " + when(o) + "\n   " + dateLine(o).replace("\n", "\n   "))
                .collect(Collectors.joining("\n"));
        return new Message("Nhắc lịch: " + items.size() + " sự kiện sắp tới", clip(body));
    }

    /** Tên kèm thứ tự: giỗ lần thứ N, sinh nhật tuổi N. */
    private static String headline(CalendarOccurrenceResponse o) {
        if (o.ordinal() == null) {
            return o.title();
        }
        return switch (o.type()) {
            case MEMORIAL -> o.title() + " (giỗ lần thứ " + o.ordinal() + ")";
            case BIRTHDAY -> o.title() + " (" + o.ordinal() + " tuổi)";
            case CUSTOM -> o.title();
        };
    }

    private static String when(CalendarOccurrenceResponse o) {
        return switch (o.daysUntil()) {
            case 0 -> "hôm nay";
            case 1 -> "ngày mai";
            default -> "còn " + o.daysUntil() + " ngày";
        };
    }

    private static String dateLine(CalendarOccurrenceResponse o) {
        String solar = solarText(o);
        String lunar = lunarText(o);
        String extra = o.type() == EventType.CUSTOM && o.description() != null && !o.description().isBlank()
                ? "\nGhi chú: " + o.description().strip() : "";
        if (o.type() == EventType.MEMORIAL) {
            return "Ngày giỗ: " + lunar + " (dương lịch: " + solar + ")" + extra;
        }
        String label = o.type() == EventType.BIRTHDAY ? "Ngày sinh nhật: " : "Thời gian: ";
        return label + solar + " dương lịch (âm lịch: " + lunarShort(o) + ")" + extra;
    }

    private static String solarText(CalendarOccurrenceResponse o) {
        LocalDate d = LocalDate.of(o.solar().year(), o.solar().month(), o.solar().day());
        DayOfWeek w = d.getDayOfWeek();
        return "%s, %02d/%02d/%04d".formatted(WEEKDAY[w.getValue() - 1], d.getDayOfMonth(), d.getMonthValue(), d.getYear());
    }

    private static String lunarShort(CalendarOccurrenceResponse o) {
        var l = o.lunar();
        return "%02d/%02d/%04d%s".formatted(l.day(), l.month(), l.year(), l.leap() ? " nhuận" : "");
    }

    private static String lunarText(CalendarOccurrenceResponse o) {
        return lunarShort(o) + " âm lịch";
    }

    private static String clip(String s) {
        return s.length() <= MAX_BODY ? s : s.substring(0, MAX_BODY - 3) + "...";
    }
}
