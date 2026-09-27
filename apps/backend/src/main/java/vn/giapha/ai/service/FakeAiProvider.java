package vn.giapha.ai.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import vn.giapha.common.util.SearchText;

/**
 * {@link AiProvider} giả lập cho profile {@code dev} và {@code test} (không tốn quota Gemini trả phí). Không phải mô
 * hình ngôn ngữ: nhận diện vài mẫu câu tiếng Việt thường gặp bằng từ khóa rồi gọi đúng tool thật qua {@code tools} —
 * dữ liệu trả về vẫn là dữ liệu thật, chỉ có phần "hiểu câu hỏi" là giả. Đủ để test tay lặp lại được (Đợt 36–37).
 */
@Component
@Profile({ "dev", "test" })
class FakeAiProvider implements AiProvider {

    private static final List<String> CONTACT_KEYWORDS = List.of("dien thoai", "sdt", "so dien thoai", "email",
            "gmail");
    private static final List<String> SELF_EDIT_KEYWORDS = List.of("ho so", "thong tin ca nhan", "nguoi than",
            "tieu su");
    private static final List<String> EDIT_VERBS = List.of("sua", "doi", "cap nhat", "chinh");
    private static final List<String> SELF_WORDS = List.of("toi", "cua toi", "minh", "ban than");

    private static final List<String> DEATH_PREFIXES = List.of("ngay gio cua", "ngay mat cua", "ngay gio", "gio",
            "ngay mat");
    private static final List<String> BIRTH_PREFIXES = List.of("sinh nhat cua", "ngay sinh cua", "sinh nhat",
            "ngay sinh");
    private static final List<String> NAME_SUFFIXES = List.of("la ngay nao", "vao ngay nao", "ngay nao",
            "la bao nhieu", "la gi");

    private static final Pattern CREATE_EVENT = Pattern.compile(
            "(?:them|tao) su kien (.+?) ngay (\\d{1,2}) thang (gieng|chap|\\d{1,2})(?: nam (\\d{4}))?\\s*(am|duong)?");

    @Override
    public String reply(String systemPrompt, List<Turn> history, String userMessage, ToolExecutor tools) {
        String cleaned = clean(userMessage);

        if (containsAny(cleaned, CONTACT_KEYWORDS)) {
            return "Trợ lý không có số điện thoại hay email của thành viên. Bạn xem thông tin này trực tiếp trên hồ sơ (chỉ Admin hoặc chính chủ mới thấy).";
        }

        if (isSelfEditRequest(cleaned)) {
            return "Bạn tự sửa trực tiếp trên trang hồ sơ của mình (hồ sơ, người thân, ảnh đại diện) — trợ lý không soạn thay được phần này.";
        }

        Matcher createEvent = CREATE_EVENT.matcher(cleaned);
        if (createEvent.find()) {
            return draftFromCreateEvent(createEvent, tools);
        }
        if (cleaned.contains("su kien")
                && (cleaned.contains("them") || cleaned.contains("sua") || cleaned.contains("xoa"))) {
            return "Bạn cho trợ lý biết rõ hơn: tên sự kiện, ngày (âm hay dương) — hoặc mã sự kiện nếu muốn sửa/xóa một sự kiện đã có.";
        }

        String name = extractName(cleaned, DEATH_PREFIXES);
        if (name != null) {
            return answerAboutMember(name, true, tools);
        }
        name = extractName(cleaned, BIRTH_PREFIXES);
        if (name != null) {
            return answerAboutMember(name, false, tools);
        }

        return "Trợ lý chỉ hỗ trợ các câu hỏi về gia phả, ngày giỗ, sinh nhật và sự kiện chung. Bạn có thể hỏi: "
                + "\"Cụ [tên] mất ngày nào?\", \"Sắp tới có sự kiện gì?\", \"Gia phả có bao nhiêu thành viên?\".";
    }

    @SuppressWarnings("unchecked")
    private String answerAboutMember(String name, boolean death, ToolExecutor tools) {
        Map<String, Object> found = tools.execute("searchMembers", Map.of("query", name));
        List<Map<String, Object>> matches = (List<Map<String, Object>>) found.getOrDefault("members", List.of());
        if (matches.isEmpty()) {
            return "Trợ lý không tìm thấy thành viên tên \"" + name + "\" trong gia phả.";
        }
        Object idRaw = matches.get(0).get("id");
        Long memberId = idRaw instanceof Number n ? n.longValue() : null;
        if (memberId == null) {
            return "Trợ lý không tìm thấy thành viên tên \"" + name + "\" trong gia phả.";
        }
        Map<String, Object> info = tools.execute("getMember", Map.of("memberId", memberId));
        String fullName = String.valueOf(info.getOrDefault("fullName", name));
        if (death) {
            Object dl = info.get("deathLunarDay");
            Object ml = info.get("deathLunarMonth");
            if (dl != null && ml != null) {
                return "Giỗ " + fullName + " vào ngày " + dl + "/" + ml + " âm lịch.";
            }
            Object ds = info.get("deathSolarDay");
            Object ms = info.get("deathSolarMonth");
            if (ds != null && ms != null) {
                return "Giỗ " + fullName + " vào ngày " + ds + "/" + ms + " dương lịch.";
            }
            return "Gia phả chưa ghi ngày mất của " + fullName + ".";
        }
        Object bd = info.get("birthDay");
        Object bm = info.get("birthMonth");
        if (bd != null && bm != null) {
            String cal = Boolean.TRUE.equals(info.get("birthLunar")) ? " âm lịch" : " dương lịch";
            return "Sinh nhật " + fullName + " vào ngày " + bd + "/" + bm + cal + ".";
        }
        Object by = info.get("birthYear");
        if (by != null) {
            return fullName + " sinh năm " + by + ".";
        }
        return "Gia phả chưa ghi ngày sinh của " + fullName + ".";
    }

    private String draftFromCreateEvent(Matcher m, ToolExecutor tools) {
        String title = m.group(1).trim();
        int day = Integer.parseInt(m.group(2));
        String monthRaw = m.group(3);
        int month = switch (monthRaw) {
            case "gieng" -> 1;
            case "chap" -> 12;
            default -> Integer.parseInt(monthRaw);
        };
        String yearRaw = m.group(4);
        String calendarWord = m.group(5);
        String calendar = "am".equals(calendarWord) ? "LUNAR" : "SOLAR";

        Map<String, Object> args = new LinkedHashMap<>();
        args.put("action", "CREATE");
        args.put("title", title);
        args.put("calendar", calendar);
        args.put("day", day);
        args.put("month", month);
        if (yearRaw != null) {
            args.put("year", Integer.parseInt(yearRaw));
        }
        Map<String, Object> result = tools.execute("draftProposal", args);
        if (result.containsKey("error")) {
            return "Trợ lý chưa soạn được: " + result.get("error");
        }
        String calendarLabel = "LUNAR".equals(calendar) ? "âm lịch" : "dương lịch";
        return "Đã soạn xong bản nháp \"" + title + "\" ngày " + day + "/" + month + " " + calendarLabel
                + ". Bạn xem thẻ bên dưới để gửi đề xuất.";
    }

    private static boolean isSelfEditRequest(String cleaned) {
        boolean hasEditVerb = containsAny(cleaned, EDIT_VERBS);
        boolean hasSelfTarget = containsAny(cleaned, SELF_EDIT_KEYWORDS) && containsAny(cleaned, SELF_WORDS);
        return hasEditVerb && hasSelfTarget;
    }

    private static String extractName(String cleaned, List<String> prefixes) {
        for (String prefix : prefixes) {
            if (cleaned.startsWith(prefix + " ")) {
                String rest = cleaned.substring(prefix.length()).trim();
                for (String suffix : NAME_SUFFIXES) {
                    if (rest.endsWith(" " + suffix)) {
                        rest = rest.substring(0, rest.length() - suffix.length()).trim();
                        break;
                    }
                }
                return rest.isBlank() ? null : rest;
            }
        }
        return null;
    }

    private static boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private static String clean(String message) {
        String normalized = SearchText.normalize(message);
        return normalized.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }
}
