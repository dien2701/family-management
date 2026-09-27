package vn.giapha.ai.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.ai.dto.AiDraftAction;
import vn.giapha.ai.dto.AiDraftChange;
import vn.giapha.ai.dto.AiDraftRecord;
import vn.giapha.ai.dto.AiDraftStatus;
import vn.giapha.calendar.CalendarFacade;
import vn.giapha.calendar.LunarDate;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.event.EventFacade;
import vn.giapha.event.dto.CustomEventInput;
import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.member.MemberFacade;
import vn.giapha.member.MemberFacade.MemberInfo;
import vn.giapha.member.MemberFacade.MemberRef;
import vn.giapha.member.MemberFacade.RelativeRef;
import vn.giapha.tree.TreeFacade;
import vn.giapha.tree.TreeFacade.FamilyMembers;
import vn.giapha.tree.TreeFacade.TreePath;

/**
 * Dựng một {@link AiToolExecutor} cho mỗi lượt hỏi (giữ trạng thái riêng: bản nháp vừa soạn nếu có). Các tool chỉ
 * đọc (IDEA §10; DECISIONS #73), gọi qua facade — không bao giờ trả SĐT hay email.
 */
@Component
class AiToolExecutorFactory {

    private final MemberFacade members;
    private final TreeFacade tree;
    private final CalendarFacade calendar;
    private final EventFacade events;
    private final JsonMapper json;

    AiToolExecutorFactory(MemberFacade members, TreeFacade tree, CalendarFacade calendar, EventFacade events,
            JsonMapper json) {
        this.members = members;
        this.tree = tree;
        this.calendar = calendar;
        this.events = events;
        this.json = json;
    }

    AiToolExecutor create() {
        return new AiToolExecutor(members, tree, calendar, events, json);
    }
}

class AiToolExecutor implements AiProvider.ToolExecutor {

    private static final int SEARCH_LIMIT = 10;

    private final MemberFacade members;
    private final TreeFacade tree;
    private final CalendarFacade calendar;
    private final EventFacade events;
    private final JsonMapper json;

    private AiDraftRecord lastDraft;

    AiToolExecutor(MemberFacade members, TreeFacade tree, CalendarFacade calendar, EventFacade events,
            JsonMapper json) {
        this.members = members;
        this.tree = tree;
        this.calendar = calendar;
        this.events = events;
        this.json = json;
    }

    /** Bản nháp vừa soạn ở lượt gọi tool gần nhất (nếu có {@code draftProposal}); dùng để phát sự kiện SSE {@code draft}. */
    Optional<AiDraftRecord> lastDraft() {
        return Optional.ofNullable(lastDraft);
    }

    @Override
    public Map<String, Object> execute(String name, Map<String, Object> args) {
        Map<String, Object> safeArgs = args == null ? Map.of() : args;
        try {
            return switch (name) {
                case "searchMembers" -> searchMembers(safeArgs);
                case "getMember" -> getMember(safeArgs);
                case "getRelatives" -> getRelatives(safeArgs);
                case "getTreePath" -> getTreePath(safeArgs);
                case "upcomingEvents" -> upcomingEvents();
                case "lunarConvert" -> lunarConvert(safeArgs);
                case "stats" -> stats();
                case "draftProposal" -> draftProposal(safeArgs);
                default -> Map.of("error", "Không có tool tên " + name + ".");
            };
        } catch (BusinessException e) {
            return Map.of("error", e.getMessage());
        }
    }

    private Map<String, Object> searchMembers(Map<String, Object> args) {
        String query = str(args, "query", "");
        List<MemberRef> found = members.searchMembers(query, SEARCH_LIMIT);
        return Map.of("members", toMapList(found));
    }

    private Map<String, Object> getMember(Map<String, Object> args) {
        Long memberId = longArg(args, "memberId");
        if (memberId == null) {
            return Map.of("error", "Cần memberId.");
        }
        Optional<MemberInfo> info = members.getInfo(memberId);
        if (info.isEmpty()) {
            return Map.of("error", "Không tìm thấy thành viên này.");
        }
        return toMap(info.get());
    }

    private Map<String, Object> getRelatives(Map<String, Object> args) {
        Long memberId = longArg(args, "memberId");
        if (memberId == null) {
            return Map.of("error", "Cần memberId.");
        }
        List<RelativeRef> declared = members.getRelativeList(memberId);
        Optional<FamilyMembers> family = tree.getFamilyOf(memberId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("declaredRelatives", toMapList(declared));
        result.put("onTree", family.isPresent());
        result.put("parents", toMapList(family.map(FamilyMembers::parents).orElse(List.of())));
        result.put("spouses", toMapList(family.map(FamilyMembers::spouses).orElse(List.of())));
        result.put("children", toMapList(family.map(FamilyMembers::children).orElse(List.of())));
        return result;
    }

    private Map<String, Object> getTreePath(Map<String, Object> args) {
        Long memberId = longArg(args, "memberId");
        if (memberId == null) {
            return Map.of("error", "Cần memberId.");
        }
        Optional<TreePath> path = tree.getTreePath(memberId);
        if (path.isEmpty()) {
            return Map.of("onTree", false);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("onTree", true);
        result.put("ancestors", toMapList(path.get().ancestors()));
        result.put("descendants", toMapList(path.get().descendants()));
        return result;
    }

    private Map<String, Object> upcomingEvents() {
        return Map.of("events", toObject(events.upcoming30()));
    }

    private Map<String, Object> lunarConvert(Map<String, Object> args) {
        String direction = str(args, "direction", "TO_LUNAR").toUpperCase(Locale.ROOT);
        if ("TO_SOLAR".equals(direction)) {
            LunarDate lunar = new LunarDate(intArg(args, "year", 0), intArg(args, "month", 0),
                    intArg(args, "day", 0), boolArg(args, "leap", false));
            LocalDate solar = calendar.toSolar(lunar);
            return Map.of("solar", Map.of("year", solar.getYear(), "month", solar.getMonthValue(), "day",
                    solar.getDayOfMonth()));
        }
        LocalDate solar = LocalDate.of(intArg(args, "year", 0), intArg(args, "month", 0), intArg(args, "day", 0));
        LunarDate lunar = calendar.toLunar(solar);
        return Map.of("lunar",
                Map.of("year", lunar.year(), "month", lunar.month(), "day", lunar.day(), "leap", lunar.leap()));
    }

    private Map<String, Object> stats() {
        MemberFacade.MemberStats memberStats = members.stats();
        TreeFacade.Stats treeStats = tree.stats();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalMembers", memberStats.total());
        result.put("living", memberStats.living());
        result.put("deceased", memberStats.deceased());
        result.put("onTree", treeStats.onTree());
        result.put("maxGeneration", treeStats.maxGeneration());
        result.put("upcoming30Count", events.upcoming30().size());
        return result;
    }

    /**
     * Soạn bản nháp đề xuất sự kiện chung (IDEA §10; DECISIONS #77). Chỉ soạn, không ghi vào dữ liệu gia phả: kết
     * quả được lưu ở {@link #lastDraft} để {@code AiChatService} phát sự kiện SSE {@code draft} và lưu lịch sử.
     */
    private Map<String, Object> draftProposal(Map<String, Object> args) {
        AiDraftAction action;
        try {
            action = AiDraftAction.valueOf(str(args, "action", "").toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return Map.of("error", "action chỉ nhận CREATE, UPDATE hoặc DELETE.");
        }
        Long eventId = longArg(args, "eventId");
        CustomEventResponse existing = null;
        if (action != AiDraftAction.CREATE) {
            if (eventId == null) {
                return Map.of("error", "Cần eventId để sửa hoặc xóa sự kiện.");
            }
            Optional<CustomEventResponse> found = events.find(eventId);
            if (found.isEmpty()) {
                return Map.of("error", "Không tìm thấy sự kiện này.");
            }
            existing = found.get();
        }

        List<AiDraftChange> changes = new ArrayList<>();
        String eventTitle;
        Map<String, Object> payload = null;

        if (action == AiDraftAction.DELETE) {
            eventTitle = existing.title();
            changes.add(new AiDraftChange("title", "Tên sự kiện", existing.title(), null));
            changes.add(new AiDraftChange("date", "Ngày",
                    describeDate(existing.calendar().name(), existing.day(), existing.month(), existing.year(),
                            existing.leap()),
                    null));
        } else {
            String calendarStr = existing != null && !args.containsKey("calendar") ? existing.calendar().name()
                    : "LUNAR".equalsIgnoreCase(str(args, "calendar", "SOLAR")) ? "LUNAR" : "SOLAR";
            String title = str(args, "title", existing != null ? existing.title() : "");
            String description = strOrNull(args, "description", existing != null ? existing.description() : null);
            Integer day = intArgOrNull(args, "day");
            Integer month = intArgOrNull(args, "month");
            Integer year = intArgOrNull(args, "year");
            Boolean leap = boolArgOrNull(args, "leap");
            if (existing != null) {
                day = day != null ? day : existing.day();
                month = month != null ? month : existing.month();
                year = args.containsKey("year") ? year : existing.year();
                leap = leap != null ? leap : existing.leap();
            }
            if (day == null || month == null) {
                return Map.of("error", "Cần ngày và tháng của sự kiện.");
            }

            payload = new LinkedHashMap<>();
            payload.put("title", title);
            payload.put("description", description);
            payload.put("calendar", calendarStr);
            payload.put("day", day);
            payload.put("month", month);
            payload.put("year", year);
            payload.put("leap", leap);
            CustomEventInput input = json.convertValue(payload, CustomEventInput.class);
            events.validate(input);
            eventTitle = title;

            String newDate = describeDate(calendarStr, day, month, year, leap);
            if (action == AiDraftAction.CREATE) {
                changes.add(new AiDraftChange("title", "Tên sự kiện", null, title));
                changes.add(new AiDraftChange("date", "Ngày", null, newDate));
            } else {
                if (!existing.title().equals(title)) {
                    changes.add(new AiDraftChange("title", "Tên sự kiện", existing.title(), title));
                }
                String oldDate = describeDate(existing.calendar().name(), existing.day(), existing.month(),
                        existing.year(), existing.leap());
                if (!oldDate.equals(newDate)) {
                    changes.add(new AiDraftChange("date", "Ngày", oldDate, newDate));
                }
            }
        }

        this.lastDraft = new AiDraftRecord(null, action, eventId, eventTitle, changes, AiDraftStatus.PENDING,
                payload);
        return Map.of("draftCreated", true, "eventTitle", eventTitle, "changesCount", changes.size());
    }

    private static String describeDate(String calendarStr, Integer day, Integer month, Integer year, Boolean leap) {
        if (day == null || month == null) {
            return "";
        }
        String ymd = day + "/" + month + (year != null ? "/" + year : " (hằng năm)");
        return ymd + ("LUNAR".equals(calendarStr) ? " âm" + (Boolean.TRUE.equals(leap) ? " (nhuận)" : "") : " dương");
    }

    // ---------- Chuyển đổi JSON ----------

    private Map<String, Object> toMap(Object value) {
        return json.convertValue(value, Map.class);
    }

    private Object toObject(Object value) {
        return json.convertValue(value, Object.class);
    }

    private List<Object> toMapList(List<?> values) {
        return values.stream().map(this::toObject).toList();
    }

    // ---------- Đọc tham số ----------

    private static String str(Map<String, Object> args, String key, String fallback) {
        Object v = args.get(key);
        return v == null ? fallback : String.valueOf(v);
    }

    private static String strOrNull(Map<String, Object> args, String key, String fallback) {
        Object v = args.get(key);
        return v == null ? fallback : String.valueOf(v);
    }

    private static Long longArg(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v instanceof Number n ? n.longValue() : null;
    }

    private static int intArg(Map<String, Object> args, String key, int fallback) {
        Object v = args.get(key);
        return v instanceof Number n ? n.intValue() : fallback;
    }

    private static Integer intArgOrNull(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v instanceof Number n ? n.intValue() : null;
    }

    private static boolean boolArg(Map<String, Object> args, String key, boolean fallback) {
        Object v = args.get(key);
        return v instanceof Boolean b ? b : fallback;
    }

    private static Boolean boolArgOrNull(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v instanceof Boolean b ? b : null;
    }
}
