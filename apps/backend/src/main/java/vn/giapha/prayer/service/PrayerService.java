package vn.giapha.prayer.service;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.prayer.dto.PrayerFillBody;
import vn.giapha.prayer.dto.PrayerInput;
import vn.giapha.prayer.dto.PrayerResponse;
import vn.giapha.prayer.dto.PrayerSummaryResponse;
import vn.giapha.prayer.entity.Prayer;
import vn.giapha.prayer.entity.PrayerFill;
import vn.giapha.prayer.entity.PrayerFillId;
import vn.giapha.prayer.mapper.PrayerMapper;
import vn.giapha.prayer.repository.PrayerFillRepository;
import vn.giapha.prayer.repository.PrayerRepository;

/**
 * Bài khấn (DECISIONS #90). Admin thêm, sửa, xóa; ai cũng xem. Thông tin đã điền chỉ chính chủ đọc/ghi: tài khoản
 * lấy từ token, không bao giờ từ body, và không có API đọc của người khác (Admin cũng vậy).
 */
@Service
public class PrayerService {

    private static final String TARGET_TYPE = "PRAYER";
    /** Ô trống {Tên ô}: không chứa ngoặc nhọn hay xuống dòng. Khớp bản TS ở features/prayer/slots.ts. */
    private static final Pattern SLOT = Pattern.compile("\\{([^{}\\r\\n]*)}");
    private static final int MAX_SLOTS = 30;
    private static final int MAX_SLOT_NAME = 50;
    private static final int MAX_VALUE = 500;
    private static final TypeReference<LinkedHashMap<String, String>> VALUES_TYPE = new TypeReference<>() {
    };

    private final PrayerRepository prayers;
    private final PrayerFillRepository fills;
    private final PrayerMapper mapper;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final JsonMapper json;
    private final Clock clock;

    PrayerService(PrayerRepository prayers, PrayerFillRepository fills, PrayerMapper mapper, AuthFacade auth,
            AuditLogWriter audit, JsonMapper json, Clock clock) {
        this.prayers = prayers;
        this.fills = fills;
        this.mapper = mapper;
        this.auth = auth;
        this.audit = audit;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<PrayerSummaryResponse> list() {
        return prayers.findAllByOrderByTitleAscIdAsc().stream().map(mapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public PrayerResponse get(Long id) {
        return mapper.toResponse(find(id));
    }

    @Transactional
    public PrayerResponse create(Long actorId, PrayerInput input) {
        requireAdmin(actorId);
        String title = cleanTitle(input);
        validateSlots(input.content());
        Prayer prayer = new Prayer(Instant.now(clock));
        prayer.apply(title, input.content(), Instant.now(clock));
        prayers.save(prayer);
        PrayerResponse response = mapper.toResponse(prayer);
        audit.write(actorId, "CREATE", TARGET_TYPE, prayer.getId(), null, response);
        return response;
    }

    @Transactional
    public PrayerResponse update(Long actorId, Long id, PrayerInput input) {
        requireAdmin(actorId);
        Prayer prayer = find(id);
        String title = cleanTitle(input);
        validateSlots(input.content());
        PrayerResponse before = mapper.toResponse(prayer);
        prayer.apply(title, input.content(), Instant.now(clock));
        PrayerResponse after = mapper.toResponse(prayer);
        audit.write(actorId, "UPDATE", TARGET_TYPE, id, before, after);
        return after;
    }

    @Transactional
    public void delete(Long actorId, Long id) {
        requireAdmin(actorId);
        Prayer prayer = find(id);
        PrayerResponse before = mapper.toResponse(prayer);
        // prayer_fill xóa theo nhờ FK ON DELETE CASCADE
        prayers.delete(prayer);
        audit.write(actorId, "DELETE", TARGET_TYPE, id, before, null);
    }

    @Transactional(readOnly = true)
    public PrayerFillBody getFill(Long accountId, Long prayerId) {
        requireExists(prayerId);
        return fills.findById(new PrayerFillId(accountId, prayerId))
                .map(f -> new PrayerFillBody(readValues(f.getValuesJson())))
                .orElseGet(() -> new PrayerFillBody(Map.of()));
    }

    @Transactional
    public PrayerFillBody saveFill(Long accountId, Long prayerId, PrayerFillBody body) {
        requireExists(prayerId);
        validateValues(body.values());
        // Giá trị null coi như rỗng, giữ nguyên thứ tự ô
        Map<String, String> values = new LinkedHashMap<>();
        body.values().forEach((k, v) -> values.put(k, v == null ? "" : v));
        String valuesJson = json.writeValueAsString(values);
        Instant now = Instant.now(clock);
        PrayerFill fill = fills.findById(new PrayerFillId(accountId, prayerId)).orElse(null);
        if (fill == null) {
            fills.save(new PrayerFill(accountId, prayerId, valuesJson, now));
        } else {
            fill.apply(valuesJson, now);
        }
        return new PrayerFillBody(values);
    }

    private Map<String, String> readValues(String valuesJson) {
        return json.readValue(valuesJson, VALUES_TYPE);
    }

    private static String cleanTitle(PrayerInput input) {
        return input.title().trim();
    }

    /** Tên ô 1–50 ký tự (sau khi cắt khoảng trắng), tối đa 30 ô khác nhau; cùng tên là một ô. */
    private static void validateSlots(String content) {
        Set<String> names = new LinkedHashSet<>();
        Matcher m = SLOT.matcher(content);
        while (m.find()) {
            String name = m.group(1).trim();
            if (name.isEmpty() || name.length() > MAX_SLOT_NAME) {
                throw invalid("content", "Tên ô trong {…} phải dài 1–50 ký tự.");
            }
            names.add(name);
        }
        if (names.size() > MAX_SLOTS) {
            throw invalid("content", "Mỗi bài tối đa 30 ô trống {…} khác nhau.");
        }
    }

    private static void validateValues(Map<String, String> values) {
        if (values.size() > MAX_SLOTS) {
            throw invalid("values", "Tối đa 30 ô thông tin cho mỗi bài.");
        }
        for (Map.Entry<String, String> e : values.entrySet()) {
            String name = e.getKey();
            if (name == null || name.isBlank() || name.length() > MAX_SLOT_NAME) {
                throw invalid("values", "Tên ô phải dài 1–50 ký tự.");
            }
            if (e.getValue() != null && e.getValue().length() > MAX_VALUE) {
                throw invalid("values", "Mỗi giá trị tối đa 500 ký tự.");
            }
        }
    }

    private static BusinessException invalid(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message,
                List.of(new FieldError(field, message)));
    }

    private Prayer find(Long id) {
        return prayers.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRAYER_NOT_FOUND",
                        "Không tìm thấy bài khấn này."));
    }

    private void requireExists(Long id) {
        if (!prayers.existsById(id)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "PRAYER_NOT_FOUND", "Không tìm thấy bài khấn này.");
        }
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }
}
