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

    /** Chạy trong transaction của nơi gọi để đồng ý và việc tạo/tham gia family cùng commit hoặc cùng rollback. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Long userId, Long familyId, String ip) {
        repository.save(new UserConsent(userId, familyId, props.policy().version(), Instant.now(clock), ip));
    }
}
