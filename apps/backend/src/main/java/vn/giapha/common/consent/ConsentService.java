package vn.giapha.common.consent;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.common.config.DynamicSettings;

/** Lưu lần đồng ý dữ liệu cá nhân kèm phiên bản chính sách hiện hành (Admin đổi ở Cấu hình hệ thống, Đợt 32). */
@Service
public class ConsentService {

    private final UserConsentRepository repository;
    private final DynamicSettings settings;
    private final Clock clock;

    ConsentService(UserConsentRepository repository, DynamicSettings settings, Clock clock) {
        this.repository = repository;
        this.settings = settings;
        this.clock = clock;
    }

    /** Chạy trong transaction của nơi gọi. Đã đồng ý phiên bản hiện hành rồi thì không ghi thêm (DECISIONS #57). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordIfMissing(Long userId, String ip) {
        if (!hasAcceptedCurrentPolicy(userId)) {
            repository.save(new UserConsent(userId, currentVersion(), Instant.now(clock), ip));
        }
    }

    /** False khi chưa từng đồng ý hoặc chỉ đồng ý phiên bản chính sách cũ. */
    @Transactional(readOnly = true)
    public boolean hasAcceptedCurrentPolicy(Long userId) {
        return repository.existsByUserIdAndPolicyVersion(userId, currentVersion());
    }

    private String currentVersion() {
        return String.valueOf(settings.policyVersion());
    }
}
