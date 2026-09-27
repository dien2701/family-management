package vn.giapha.admin.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.admin.dto.SystemSettingsResponse;
import vn.giapha.admin.entity.SystemSetting;
import vn.giapha.admin.repository.SystemSettingRepository;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.config.DynamicSettings;

/**
 * Cấu hình hệ thống dạng key-value (IDEA §6.10; DECISIONS #55, #62), cache Caffeine (một mục, nạp lại toàn bộ khi
 * Admin sửa). Cũng là {@link DynamicSettings} cho module khác (consent, file) đọc giá trị hiện hành.
 */
@Service
public class SystemSettingsService implements DynamicSettings {

    private static final String TARGET_TYPE = "SYSTEM_SETTING";
    private static final String CACHE_KEY = "current";

    private static final String POLICY_VERSION = "POLICY_VERSION";
    private static final String AI_QUOTA_USER = "AI_QUOTA_USER";
    private static final String AI_QUOTA_ADMIN = "AI_QUOTA_ADMIN";
    private static final String UPLOAD_MAX_MB = "UPLOAD_MAX_MB";
    private static final String TOTAL_QUOTA_MB = "TOTAL_QUOTA_MB";

    /** Giá trị mặc định khi bảng chưa có dòng tương ứng (không nên xảy ra sau V12, chỉ để phòng hờ). */
    private static final Map<String, Integer> DEFAULTS = Map.of(
            POLICY_VERSION, 1,
            AI_QUOTA_USER, 15,
            AI_QUOTA_ADMIN, 30,
            UPLOAD_MAX_MB, 10,
            TOTAL_QUOTA_MB, 1024);

    private final SystemSettingRepository repository;
    private final AdminGuard guard;
    private final AuditLogWriter audit;
    private final Clock clock;
    private final Cache<String, SystemSettingsResponse> cache = Caffeine.newBuilder().maximumSize(1).build();

    SystemSettingsService(SystemSettingRepository repository, AdminGuard guard, AuditLogWriter audit, Clock clock) {
        this.repository = repository;
        this.guard = guard;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public SystemSettingsResponse get(Long actorId) {
        guard.require(actorId);
        return current();
    }

    @Transactional
    public SystemSettingsResponse update(Long actorId, SystemSettingsResponse input) {
        guard.require(actorId);
        SystemSettingsResponse before = current();
        Instant now = Instant.now(clock);
        save(POLICY_VERSION, input.policyVersion(), actorId, now);
        save(AI_QUOTA_USER, input.aiQuotaUser(), actorId, now);
        save(AI_QUOTA_ADMIN, input.aiQuotaAdmin(), actorId, now);
        save(UPLOAD_MAX_MB, input.uploadMaxMb(), actorId, now);
        save(TOTAL_QUOTA_MB, input.totalQuotaMb(), actorId, now);
        cache.invalidateAll();
        SystemSettingsResponse after = current();
        audit.write(actorId, "UPDATE", TARGET_TYPE, null, before, after);
        return after;
    }

    // ---------- DynamicSettings (module khác đọc, không kiểm quyền) ----------

    @Override
    public int policyVersion() {
        return current().policyVersion();
    }

    @Override
    public int aiQuotaUser() {
        return current().aiQuotaUser();
    }

    @Override
    public int aiQuotaAdmin() {
        return current().aiQuotaAdmin();
    }

    @Override
    public int uploadMaxMb() {
        return current().uploadMaxMb();
    }

    @Override
    public int totalQuotaMb() {
        return current().totalQuotaMb();
    }

    // ---------- Nội bộ ----------

    @Transactional(readOnly = true)
    SystemSettingsResponse current() {
        return cache.get(CACHE_KEY, k -> load());
    }

    private SystemSettingsResponse load() {
        Map<String, String> values = repository.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getKey, SystemSetting::getValue));
        return new SystemSettingsResponse(
                intOf(values, POLICY_VERSION),
                intOf(values, AI_QUOTA_USER),
                intOf(values, AI_QUOTA_ADMIN),
                intOf(values, UPLOAD_MAX_MB),
                intOf(values, TOTAL_QUOTA_MB));
    }

    private static int intOf(Map<String, String> values, String key) {
        String v = values.get(key);
        return v == null ? DEFAULTS.get(key) : Integer.parseInt(v);
    }

    private void save(String key, int value, Long actorId, Instant now) {
        String text = String.valueOf(value);
        SystemSetting row = repository.findById(key).orElseGet(() -> new SystemSetting(key, text, actorId, now));
        row.change(text, actorId, now);
        repository.save(row);
    }
}
