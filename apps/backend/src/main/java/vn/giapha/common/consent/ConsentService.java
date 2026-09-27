package vn.giapha.common.consent;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.config.AppProperties;

/** Lưu lần đồng ý dữ liệu cá nhân kèm phiên bản chính sách hiện hành ({@code app.policy.version}). */
@Service
public class ConsentService {

    private final UserConsentRepository repository;
    private final AppProperties props;
    private final Clock clock;

    ConsentService(UserConsentRepository repository, AppProperties props, Clock clock) {
        this.repository = repository;
        this.props = props;
        this.clock = clock;
    }

    /** Chạy trong transaction của nơi gọi. Đã đồng ý phiên bản hiện hành rồi thì không ghi thêm (DECISIONS #57). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordIfMissing(Long userId, String ip) {
        if (!hasAcceptedCurrentPolicy(userId)) {
            repository.save(new UserConsent(userId, props.policy().version(), Instant.now(clock), ip));
        }
    }

    /** False khi chưa từng đồng ý hoặc chỉ đồng ý phiên bản chính sách cũ. */
    @Transactional(readOnly = true)
    public boolean hasAcceptedCurrentPolicy(Long userId) {
        return repository.existsByUserIdAndPolicyVersion(userId, props.policy().version());
    }
}
