package vn.giapha.prayer.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Khóa chính ghép của {@link PrayerFill}: một dòng cho mỗi cặp (tài khoản, bài). */
@Embeddable
public class PrayerFillId implements Serializable {

    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "prayer_id")
    private Long prayerId;

    protected PrayerFillId() {
    }

    public PrayerFillId(Long accountId, Long prayerId) {
        this.accountId = accountId;
        this.prayerId = prayerId;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof PrayerFillId other
                && Objects.equals(accountId, other.accountId) && Objects.equals(prayerId, other.prayerId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accountId, prayerId);
    }
}
