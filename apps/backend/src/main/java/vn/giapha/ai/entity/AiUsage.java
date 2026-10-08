package vn.giapha.ai.entity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Lượt hỏi AI đã dùng trong ngày của một tài khoản (IDEA §10). Reset lúc 0h giờ Việt Nam: khi {@code usageDate}
 * khác hôm nay (giờ VN) thì coi như chưa dùng lượt nào, không cần job dọn riêng.
 */
@Entity
@Table(name = "ai_usage")
public class AiUsage {

    @Id
    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AiUsage() {
    }

    public AiUsage(Long accountId, LocalDate usageDate, int usedCount, Instant updatedAt) {
        this.accountId = accountId;
        this.usageDate = usageDate;
        this.usedCount = usedCount;
        this.updatedAt = updatedAt;
    }

    /** Tăng lượt đã dùng; đổi ngày thì coi như bắt đầu lại từ 0 (reset lúc 0h giờ Việt Nam). */
    public void increment(LocalDate today, Instant now) {
        if (!today.equals(usageDate)) {
            usageDate = today;
            usedCount = 0;
        }
        usedCount++;
        updatedAt = now;
    }

    /** Hoàn một lượt khi trợ lý không trả lời được (lỗi phía máy chủ); không âm, không đụng lượt của ngày khác. */
    public void decrement(LocalDate today, Instant now) {
        if (today.equals(usageDate) && usedCount > 0) {
            usedCount--;
            updatedAt = now;
        }
    }

    /** Lượt đã dùng hôm nay (giờ Việt Nam); ngày khác {@code today} nghĩa là chưa dùng lượt nào. */
    public int usedOn(LocalDate today) {
        return today.equals(usageDate) ? usedCount : 0;
    }

    public Long getAccountId() {
        return accountId;
    }
}
