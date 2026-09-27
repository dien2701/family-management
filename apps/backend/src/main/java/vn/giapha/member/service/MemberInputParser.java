package vn.giapha.member.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.calendar.CalendarFacade;
import vn.giapha.calendar.LunarDate;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.common.util.SearchText;
import vn.giapha.member.dto.MemberBirth;
import vn.giapha.member.dto.MemberInput;
import vn.giapha.member.dto.MemberLunarDate;
import vn.giapha.member.dto.MemorialOverride;
import vn.giapha.member.dto.SolarDate;
import vn.giapha.member.entity.BirthCalendar;
import vn.giapha.member.entity.Gender;
import vn.giapha.member.entity.MemberProfile;

/**
 * Kiểm tra và chuẩn hóa {@link MemberInput} thành {@link MemberProfile}: bỏ khoảng trắng thừa, chuẩn hóa {@code search_name},
 * đổi ngày mất sang lịch còn lại qua {@link CalendarFacade}, và chỉ cho nhập nhóm "đã mất" khi {@code isDeceased}.
 * Gom mọi lỗi rồi ném một {@link BusinessException} 400 {@code VALIDATION_ERROR} với lỗi theo từng trường,
 * giống handler giả lập của frontend.
 */
@Component
class MemberInputParser {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final int MAX_LABELS = 20;
    private static final int MAX_LABEL_LENGTH = 50;

    private final CalendarFacade calendar;
    private final JsonMapper json;

    MemberInputParser(CalendarFacade calendar, JsonMapper json) {
        this.calendar = calendar;
        this.json = json;
    }

    MemberProfile parse(MemberInput in) {
        List<FieldError> errors = new ArrayList<>();

        String fullName = text(in.fullName());
        if (fullName == null) {
            errors.add(new FieldError("fullName", "Vui lòng nhập họ tên."));
        }

        Gender gender = null;
        if (in.gender() != null && !in.gender().isBlank()) {
            gender = switch (in.gender().trim()) {
                case "M" -> Gender.M;
                case "F" -> Gender.F;
                default -> {
                    errors.add(new FieldError("gender", "Giới tính chỉ nhận Nam, Nữ hoặc để trống."));
                    yield null;
                }
            };
        }

        String email = text(in.email());
        if (email != null && !EMAIL.matcher(email).matches()) {
            errors.add(new FieldError("email", "Email không hợp lệ."));
        }

        String labelsJson = labelsJson(in.labels(), errors);
        MemberProfile.Birth birth = parseBirth(in.birth(), errors);
        MemberProfile.Death death = parseDeath(in, errors);

        if (!errors.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
        }
        return new MemberProfile(fullName, SearchText.normalize(fullName), text(in.tabooName()), gender,
                text(in.phone()), email, text(in.biography()), labelsJson, birth, death);
    }

    // ---------- Nhãn ----------

    /** Bỏ nhãn rỗng và trùng; không có nhãn nào thì {@code null}. */
    private String labelsJson(List<String> raw, List<FieldError> errors) {
        if (raw == null) {
            return null;
        }
        LinkedHashSet<String> labels = new LinkedHashSet<>();
        for (String label : raw) {
            String t = text(label);
            if (t != null) {
                labels.add(t);
            }
        }
        if (labels.size() > MAX_LABELS || labels.stream().anyMatch(l -> l.length() > MAX_LABEL_LENGTH)) {
            errors.add(new FieldError("labels", "Tối đa 20 nhãn, mỗi nhãn tối đa 50 ký tự."));
            return null;
        }
        return labels.isEmpty() ? null : json.writeValueAsString(labels);
    }

    // ---------- Ngày sinh ----------

    /** Ngày sinh được phép chỉ có năm. Có tháng hoặc ngày thì phải đủ ngày, tháng, năm và đúng theo lịch đã chọn. */
    private MemberProfile.Birth parseBirth(MemberBirth b, List<FieldError> errors) {
        if (b == null || (b.year() == null && b.month() == null && b.day() == null)) {
            return MemberProfile.Birth.NONE;
        }
        BirthCalendar cal = b.calendar() == null ? BirthCalendar.SOLAR : b.calendar();
        boolean lunar = cal == BirthCalendar.LUNAR;

        if (b.month() == null && b.day() == null) {
            if (b.year() < 1 || b.year() > 9999) {
                errors.add(new FieldError("birth", "Năm sinh không hợp lệ."));
                return MemberProfile.Birth.NONE;
            }
            return new MemberProfile.Birth(b.year(), null, null, cal, false);
        }
        if (b.year() == null || b.month() == null || b.day() == null) {
            errors.add(new FieldError("birth", "Ngày sinh cần đủ ngày, tháng, năm hoặc chỉ có năm."));
            return MemberProfile.Birth.NONE;
        }

        boolean leap = lunar && Boolean.TRUE.equals(b.leap());
        String problem = lunar
                ? lunarProblem(new LunarDate(b.year(), b.month(), b.day(), leap))
                : solarProblem(b.year(), b.month(), b.day());
        if (problem != null) {
            errors.add(new FieldError("birth", problem));
            return MemberProfile.Birth.NONE;
        }
        return new MemberProfile.Birth(b.year(), b.month(), b.day(), cal, leap);
    }

    // ---------- Nhóm "đã mất" ----------

    private MemberProfile.Death parseDeath(MemberInput in, List<FieldError> errors) {
        String burialPlace = text(in.burialPlace());
        if (!in.isDeceased()) {
            if (in.deathSolar() != null || in.deathLunar() != null || in.memorialOverride() != null
                    || burialPlace != null) {
                errors.add(new FieldError("isDeceased",
                        "Ngày mất, ngày giỗ và nơi an táng chỉ nhập được khi đã qua đời."));
            }
            return MemberProfile.Death.ALIVE;
        }

        Integer solarYear = null;
        Integer solarMonth = null;
        Integer solarDay = null;
        Integer lunarYear = null;
        Integer lunarMonth = null;
        Integer lunarDay = null;
        boolean lunarLeap = false;

        SolarDate solar = in.deathSolar();
        MemberLunarDate lunar = in.deathLunar();
        if (solar != null) {
            if (solar.year() == null || solar.month() == null || solar.day() == null) {
                errors.add(new FieldError("deathSolar", "Ngày mất dương cần đủ ngày, tháng, năm."));
            } else {
                String problem = solarProblem(solar.year(), solar.month(), solar.day());
                if (problem != null) {
                    errors.add(new FieldError("deathSolar", problem));
                } else {
                    LunarDate converted = calendar.toLunar(LocalDate.of(solar.year(), solar.month(), solar.day()));
                    solarYear = solar.year();
                    solarMonth = solar.month();
                    solarDay = solar.day();
                    lunarYear = converted.year();
                    lunarMonth = converted.month();
                    lunarDay = converted.day();
                    lunarLeap = converted.leap();
                }
            }
        } else if (lunar != null) {
            if (lunar.day() == null || lunar.month() == null) {
                errors.add(new FieldError("deathLunar", "Ngày mất âm cần đủ ngày, tháng, năm hoặc chỉ ngày/tháng."));
            } else {
                boolean leap = Boolean.TRUE.equals(lunar.leap());
                if (lunar.year() == null) {
                    // Chỉ ngày/tháng âm: lưu được nhưng không đổi sang dương và không có "giỗ lần thứ N"
                    if (lunar.month() < 1 || lunar.month() > 12) {
                        errors.add(new FieldError("deathLunar", "Tháng âm phải từ 1 đến 12."));
                    } else if (lunar.day() < 1 || lunar.day() > 30) {
                        errors.add(new FieldError("deathLunar", "Ngày âm phải từ 1 đến 30."));
                    } else {
                        lunarMonth = lunar.month();
                        lunarDay = lunar.day();
                        lunarLeap = leap;
                    }
                } else {
                    LunarDate date = new LunarDate(lunar.year(), lunar.month(), lunar.day(), leap);
                    String problem = lunarProblem(date);
                    if (problem != null) {
                        errors.add(new FieldError("deathLunar", problem));
                    } else {
                        LocalDate converted = calendar.toSolar(date);
                        solarYear = converted.getYear();
                        solarMonth = converted.getMonthValue();
                        solarDay = converted.getDayOfMonth();
                        lunarYear = lunar.year();
                        lunarMonth = lunar.month();
                        lunarDay = lunar.day();
                        lunarLeap = leap;
                    }
                }
            }
        }

        Integer memorialDay = null;
        Integer memorialMonth = null;
        MemorialOverride memorial = in.memorialOverride();
        if (memorial != null) {
            Integer d = memorial.day();
            Integer m = memorial.month();
            if (d != null && m != null && d >= 1 && d <= 30 && m >= 1 && m <= 12) {
                memorialDay = d;
                memorialMonth = m;
            } else {
                errors.add(new FieldError("memorialOverride", "Ngày giỗ ghi đè cần ngày 1–30 và tháng 1–12 âm lịch."));
            }
        }
        return new MemberProfile.Death(true, solarYear, solarMonth, solarDay, lunarYear, lunarMonth, lunarDay,
                lunarLeap, memorialDay, memorialMonth, burialPlace);
    }

    // ---------- Kiểm tra ngày ----------

    /** @return thông báo lỗi, hoặc {@code null} nếu ngày dương hợp lệ và đổi được sang âm */
    private String solarProblem(int year, int month, int day) {
        if (!calendar.isSupportedSolarYear(year)) {
            return "Chỉ hỗ trợ năm dương từ 1900 đến 2100.";
        }
        if (month < 1 || month > 12) {
            return "Tháng dương phải từ 1 đến 12.";
        }
        int max = YearMonth.of(year, month).lengthOfMonth();
        if (day < 1 || day > max) {
            return "Tháng " + month + " năm " + year + " dương lịch chỉ có " + max + " ngày.";
        }
        return null;
    }

    /** @return thông báo lỗi, hoặc {@code null} nếu ngày âm tồn tại (đúng tháng nhuận, đủ ngày trong tháng) */
    private String lunarProblem(LunarDate date) {
        try {
            calendar.toSolar(date);
            return null;
        } catch (BusinessException e) {
            return e.getMessage();
        }
    }

    private static String text(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        return t.isEmpty() ? null : t;
    }
}
