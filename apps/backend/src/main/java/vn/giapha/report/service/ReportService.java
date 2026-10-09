package vn.giapha.report.service;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import com.lowagie.text.PageSize;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.giapha.auth.AuthFacade;
import vn.giapha.calendar.CalendarFacade;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.event.EventFacade;
import vn.giapha.event.dto.CalendarOccurrenceResponse;
import vn.giapha.event.dto.EventType;
import vn.giapha.member.MemberFacade;
import vn.giapha.member.MemberFacade.ReportMember;

/**
 * Báo cáo Excel và PDF (IDEA §6.9; DECISIONS #48, #66). Mọi tài khoản đã duyệt xuất được (cổng duyệt do
 * {@code ApprovalGateFilter}); SĐT và email chỉ có trong báo cáo khi người xuất là Admin (đọc từ DB, không tin claim).
 */
@Service
public class ReportService {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final MemberFacade members;
    private final EventFacade events;
    private final CalendarFacade calendar;
    private final AuthFacade auth;
    private final Clock clock;

    ReportService(MemberFacade members, EventFacade events, CalendarFacade calendar, AuthFacade auth, Clock clock) {
        this.members = members;
        this.events = events;
        this.calendar = calendar;
        this.auth = auth;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- Thành viên

    public ReportFile membersExcel(Long actorId) {
        boolean admin = isAdmin(actorId);
        List<String> headers = new ArrayList<>(List.of("STT", "Họ và tên", "Tên húy", "Giới tính", "Ngày sinh",
                "Lịch ngày sinh", "Tình trạng", "Ngày mất (dương)", "Ngày mất (âm)", "Nơi an táng"));
        if (admin) {
            headers.add("Số điện thoại");
            headers.add("Email");
        }
        List<List<Object>> rows = new ArrayList<>();
        int stt = 1;
        for (ReportMember m : members.findAllForReport(admin)) {
            // Arrays.asList (không phải List.of) vì ô ngày có thể là null
            List<Object> row = new ArrayList<>(Arrays.asList(
                    stt++, m.fullName(), orEmpty(m.tabooName()), gender(m.gender()),
                    dateCell(m.birthYear(), m.birthMonth(), m.birthDay(), !m.birthLunar()),
                    hasMonthOrDay(m) ? (m.birthLunar() ? "Âm" : "Dương") : "",
                    m.deceased() ? "Đã mất" : "Còn sống",
                    dateCell(m.deathSolarYear(), m.deathSolarMonth(), m.deathSolarDay(), true),
                    lunarText(m.deathLunarYear(), m.deathLunarMonth(), m.deathLunarDay(), m.deathLunarLeap()),
                    orEmpty(m.burialPlace())));
            if (admin) {
                row.add(orEmpty(m.phone()));
                row.add(orEmpty(m.email()));
            }
            rows.add(row);
        }
        return new ReportFile(fileName("thanh-vien", "xlsx"), ReportFile.XLSX,
                ReportExcel.build("Thành viên", headers, rows));
    }

    public ReportFile membersPdf(Long actorId) {
        boolean admin = isAdmin(actorId);
        List<String> headers = new ArrayList<>(List.of("STT", "Họ và tên", "Giới tính", "Ngày sinh", "Ngày mất",
                "Nơi an táng"));
        float[] widths = {5, 24, 8, 14, 22, 27};
        if (admin) {
            headers.add("Số điện thoại");
            headers.add("Email");
            widths = new float[] {4, 18, 6, 11, 16, 15, 10, 20};
        }
        List<List<String>> rows = new ArrayList<>();
        int stt = 1;
        for (ReportMember m : members.findAllForReport(admin)) {
            List<String> row = new ArrayList<>(List.of(
                    String.valueOf(stt++), m.fullName(), gender(m.gender()), birthText(m), deathText(m),
                    orEmpty(m.burialPlace())));
            if (admin) {
                row.add(orEmpty(m.phone()));
                row.add(orEmpty(m.email()));
            }
            rows.add(row);
        }
        byte[] pdf = ReportPdf.render("Danh sách thành viên", "Ngày xuất: " + today().format(DMY) + " · "
                + rows.size() + " thành viên", PageSize.A4.rotate(),
                List.of(new ReportPdf.Section(null, headers, widths, rows)), "Chưa có thành viên.");
        return new ReportFile(fileName("thanh-vien", "pdf"), ReportFile.PDF, pdf);
    }

    // ---------------------------------------------------------------- Sự kiện

    public ReportFile eventsExcel(int year) {
        if (!calendar.isSupportedSolarYear(year)) {
            throw yearError("year", "Năm chỉ nhận từ 1900 đến 2100.");
        }
        List<String> headers = List.of("STT", "Ngày dương", "Ngày âm", "Loại", "Nội dung", "Mô tả",
                "Giỗ lần thứ / Tuổi");
        List<List<Object>> rows = new ArrayList<>();
        int stt = 1;
        for (CalendarOccurrenceResponse o : events.occurrencesBetween(LocalDate.of(year, 1, 1),
                LocalDate.of(year, 12, 31), null)) {
            rows.add(Arrays.asList(stt++, LocalDate.of(o.solar().year(), o.solar().month(),
                    o.solar().day()),
                    lunarText(o.lunar().year(), o.lunar().month(), o.lunar().day(), o.lunar().leap()),
                    typeName(o.type()), o.title(), orEmpty(o.description()), o.ordinal()));
        }
        return new ReportFile(fileName("su-kien-" + year, "xlsx"), ReportFile.XLSX,
                ReportExcel.build("Sự kiện " + year, headers, rows));
    }

    // ---------------------------------------------------------------- Lịch giỗ

    public ReportFile memorialsPdf(int lunarYear) {
        if (!calendar.isSupportedLunarYear(lunarYear)) {
            throw yearError("lunarYear", "Năm âm lịch chỉ nhận từ 1900 đến 2100.");
        }
        // Một năm âm dài tối đa 385 ngày; lấy dư rồi lọc theo năm âm của từng lần giỗ
        LocalDate from = calendar.firstDayOfMonth(lunarYear, 1, false);
        // Khóa tháng: tháng thường 2n, tháng nhuận 2n+1, nên tháng nhuận đứng ngay sau tháng thường cùng số
        Map<Integer, List<CalendarOccurrenceResponse>> byMonth = new TreeMap<>();
        for (CalendarOccurrenceResponse o : events.occurrencesBetween(from, from.plusDays(384), EventType.MEMORIAL)) {
            if (o.lunar().year() == lunarYear) {
                byMonth.computeIfAbsent(o.lunar().month() * 2 + (o.lunar().leap() ? 1 : 0), k -> new ArrayList<>())
                        .add(o);
            }
        }
        List<String> headers = List.of("Ngày âm", "Ngày dương", "Người được giỗ", "Giỗ lần thứ");
        float[] widths = {14, 18, 50, 18};
        List<ReportPdf.Section> sections = new ArrayList<>();
        int total = 0;
        for (Map.Entry<Integer, List<CalendarOccurrenceResponse>> e : byMonth.entrySet()) {
            boolean leap = e.getKey() % 2 == 1;
            List<List<String>> rows = new ArrayList<>();
            for (CalendarOccurrenceResponse o : e.getValue()) {
                rows.add(List.of(o.lunar().day() + "/" + o.lunar().month() + (leap ? " nhuận" : ""),
                        LocalDate.of(o.solar().year(), o.solar().month(), o.solar().day()).format(DMY),
                        o.title().replaceFirst("^Giỗ ", ""), o.ordinal() == null ? "" : String.valueOf(o.ordinal())));
            }
            total += rows.size();
            sections.add(new ReportPdf.Section("Tháng " + e.getKey() / 2 + (leap ? " nhuận" : "") + " âm lịch · "
                    + rows.size() + " giỗ", headers, widths, rows));
        }
        byte[] pdf = ReportPdf.render("Lịch giỗ năm " + lunarYear + " (âm lịch)",
                "Ngày xuất: " + today().format(DMY) + " · " + total + " giỗ", PageSize.A4, sections,
                "Năm này chưa có giỗ nào.");
        return new ReportFile(fileName("lich-gio-am-" + lunarYear, "pdf"), ReportFile.PDF, pdf);
    }

    // ---------------------------------------------------------------- Tiện ích

    private boolean isAdmin(Long actorId) {
        return auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(VIETNAM));
    }

    /** Tên tệp có ngày xuất, chỉ ký tự ASCII để header Content-Disposition không bị lỗi mã hóa. */
    private String fileName(String base, String ext) {
        return base + "_" + today() + "." + ext;
    }

    private static BusinessException yearError(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.",
                List.of(new FieldError(field, message)));
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String gender(String g) {
        return "M".equals(g) ? "Nam" : "F".equals(g) ? "Nữ" : "";
    }

    private static String typeName(EventType t) {
        return switch (t) {
            case MEMORIAL -> "Giỗ";
            case BIRTHDAY -> "Sinh nhật";
            case CUSTOM -> "Sự kiện chung";
        };
    }

    private static boolean hasMonthOrDay(ReportMember m) {
        return m.birthMonth() != null || m.birthDay() != null;
    }

    /**
     * Ngày dương đủ ba phần thì là ô ngày thật; thiếu, không có thật hoặc là ngày âm ({@code solar = false}) thì là
     * chuỗi một phần ("03/1950", "1950") để không mất thông tin.
     */
    private static Object dateCell(Integer year, Integer month, Integer day, boolean solar) {
        if (solar && year != null && month != null && day != null) {
            try {
                return LocalDate.of(year, month, day);
            } catch (DateTimeException e) {
                // rơi xuống dạng chuỗi
            }
        }
        String text = partial(year, month, day);
        return text.isEmpty() ? null : text;
    }

    /** "dd/MM/yyyy" với các phần có biết, ví dụ chỉ có tháng và năm thì "03/1950". */
    private static String partial(Integer year, Integer month, Integer day) {
        List<String> parts = new ArrayList<>(3);
        if (day != null) {
            parts.add(String.format("%02d", day));
        }
        if (month != null) {
            parts.add(String.format("%02d", month));
        }
        if (year != null) {
            parts.add(String.valueOf(year));
        }
        return String.join("/", parts);
    }

    private static String lunarText(Integer year, Integer month, Integer day, boolean leap) {
        String text = partial(year, month, day);
        return text.isEmpty() ? "" : text + (leap ? " (nhuận)" : "");
    }

    private static String birthText(ReportMember m) {
        String text = partial(m.birthYear(), m.birthMonth(), m.birthDay());
        return text.isEmpty() ? "" : text + (m.birthLunar() && hasMonthOrDay(m) ? " (âm)" : "");
    }

    private static String deathText(ReportMember m) {
        if (!m.deceased()) {
            return "";
        }
        String solar = partial(m.deathSolarYear(), m.deathSolarMonth(), m.deathSolarDay());
        String lunar = lunarText(m.deathLunarYear(), m.deathLunarMonth(), m.deathLunarDay(), m.deathLunarLeap());
        if (solar.isEmpty() && lunar.isEmpty()) {
            return "Đã mất";
        }
        return solar.isEmpty() ? lunar + " (âm)" : lunar.isEmpty() ? solar : solar + "\n" + lunar + " (âm)";
    }
}
