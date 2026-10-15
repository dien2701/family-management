package vn.giapha.prayer.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Thông tin cá nhân một tài khoản đã điền cho một bài (DECISIONS #90). Chỉ chính chủ đọc/ghi; {@code accountId}
 * luôn lấy từ token, không nhận từ body. Không gửi lên AI.
 */
@Entity
@Table(name = "prayer_fill")
public class PrayerFill {

    @EmbeddedId
    private PrayerFillId id;

    /** JSON: map tên ô → giá trị. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "values_json", nullable = false)
    private String valuesJson;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PrayerFill() {
    }

    public PrayerFill(Long accountId, Long prayerId, String valuesJson, Instant now) {
        this.id = new PrayerFillId(accountId, prayerId);
        this.valuesJson = valuesJson;
        this.updatedAt = now;
    }

    public void apply(String valuesJson, Instant now) {
        this.valuesJson = valuesJson;
        this.updatedAt = now;
    }

    public String getValuesJson() {
        return valuesJson;
    }
}
