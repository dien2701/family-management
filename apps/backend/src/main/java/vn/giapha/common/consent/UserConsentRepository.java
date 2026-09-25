package vn.giapha.common.consent;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

    boolean existsByUserIdAndPolicyVersion(Long userId, String policyVersion);
}
