package vn.giapha.event.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Sự kiện chung (IDEA §6.5). Giỗ và sinh nhật không lưu ở đây, tự sinh từ hồ sơ thành viên. {@code year = null}
 * nghĩa là lặp hằng năm theo {@code calendar}; có {@code year} thì chỉ diễn ra một lần. Không bao giờ trả ra API:
 * luôn qua DTO.
 */
@Entity
@Table(name = "custom_event")
public class CustomEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 5)
    private EventCalendar calendar;

    @Column(nullable = false)
    private int day;

    @Column(nullable = false)
    private int month;

    @Column
    private Integer year;

    @Column(nullable = false)
    private boolean leap;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CustomEvent() {
    }

    public CustomEvent(Long createdBy, Instant now) {
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** Thay toàn bộ nội dung (PUT thay toàn bộ). */
    public void apply(String title, String description, EventCalendar calendar, int day, int month, Integer year,
            boolean leap, Instant now) {
        this.title = title;
        this.description = description;
        this.calendar = calendar;
        this.day = day;
        this.month = month;
        this.year = year;
        this.leap = leap;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public EventCalendar getCalendar() {
        return calendar;
    }

    public int getDay() {
        return day;
    }

    public int getMonth() {
        return month;
    }

    public Integer getYear() {
        return year;
    }

    public boolean isLeap() {
        return leap;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
