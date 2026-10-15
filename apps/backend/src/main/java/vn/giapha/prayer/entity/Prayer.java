package vn.giapha.prayer.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Bài khấn mẫu. Ô trống viết {@code {Tên ô}} trong {@code content}. Không bao giờ trả ra API: luôn qua DTO. */
@Entity
@Table(name = "prayer")
public class Prayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Prayer() {
    }

    public Prayer(Instant now) {
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** Thay toàn bộ nội dung (PUT thay toàn bộ). */
    public void apply(String title, String content, Instant now) {
        this.title = title;
        this.content = content;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
