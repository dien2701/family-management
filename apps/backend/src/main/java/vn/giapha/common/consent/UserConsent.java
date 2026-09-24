package vn.giapha.common.consent;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Bản ghi đồng ý dữ liệu cá nhân theo NĐ 13/2023. Bất biến: chỉ tạo, không sửa. */
@Entity
@Table(name = "user_consent")
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(name = "policy_version", nullable = false, updatable = false, length = 20)
    private String policyVersion;

    @Column(name = "accepted_at", nullable = false, updatable = false)
    private Instant acceptedAt;

    @Column(updatable = false, length = 45)
    private String ip;

    protected UserConsent() {
    }

    UserConsent(Long userId, Long familyId, String policyVersion, Instant acceptedAt, String ip) {
        this.userId = userId;
        this.familyId = familyId;
        this.policyVersion = policyVersion;
        this.acceptedAt = acceptedAt;
        this.ip = ip;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getFamilyId() {
        return familyId;
    }

    public String getPolicyVersion() {
        return policyVersion;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public String getIp() {
        return ip;
    }
}
