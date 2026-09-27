package vn.giapha.member.entity;

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

/** Một người trong gia phả (IDEA §4). Không bao giờ trả ra API: luôn qua DTO. */
@Entity
@Table(name = "member")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "search_name", nullable = false, length = 200)
    private String searchName;

    @Column(name = "taboo_name", length = 200)
    private String tabooName;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 1)
    private Gender gender;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(length = 30)
    private String phone;

    @Column(length = 254)
    private String email;

    @Column(length = 5000)
    private String biography;

    /** Mảng JSON các nhãn đặc biệt, ví dụ {@code ["Liệt sỹ"]}. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column
    private String labels;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Column(name = "birth_month")
    private Integer birthMonth;

    @Column(name = "birth_day")
    private Integer birthDay;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "birthday_calendar", nullable = false, length = 5)
    private BirthCalendar birthdayCalendar = BirthCalendar.SOLAR;

    @Column(name = "birth_lunar_leap", nullable = false)
    private boolean birthLunarLeap;

    @Column(name = "is_deceased", nullable = false)
    private boolean deceased;

    @Column(name = "death_year")
    private Integer deathYear;

    @Column(name = "death_month")
    private Integer deathMonth;

    @Column(name = "death_day")
    private Integer deathDay;

    @Column(name = "death_lunar_year")
    private Integer deathLunarYear;

    @Column(name = "death_lunar_month")
    private Integer deathLunarMonth;

    @Column(name = "death_lunar_day")
    private Integer deathLunarDay;

    @Column(name = "death_lunar_leap", nullable = false)
    private boolean deathLunarLeap;

    @Column(name = "memorial_override_day")
    private Integer memorialOverrideDay;

    @Column(name = "memorial_override_month")
    private Integer memorialOverrideMonth;

    @Column(name = "burial_place", length = 300)
    private String burialPlace;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Member() {
    }

    public Member(Long createdBy, Instant now) {
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    /** Ghi đè toàn bộ hồ sơ (PUT thay toàn bộ); ảnh đại diện và người tạo giữ nguyên. */
    public void apply(MemberProfile p, Instant now) {
        this.fullName = p.fullName();
        this.searchName = p.searchName();
        this.tabooName = p.tabooName();
        this.gender = p.gender();
        this.phone = p.phone();
        this.email = p.email();
        this.biography = p.biography();
        this.labels = p.labelsJson();

        MemberProfile.Birth b = p.birth();
        this.birthYear = b.year();
        this.birthMonth = b.month();
        this.birthDay = b.day();
        this.birthdayCalendar = b.calendar();
        this.birthLunarLeap = b.leap();

        MemberProfile.Death d = p.death();
        this.deceased = d.deceased();
        this.deathYear = d.solarYear();
        this.deathMonth = d.solarMonth();
        this.deathDay = d.solarDay();
        this.deathLunarYear = d.lunarYear();
        this.deathLunarMonth = d.lunarMonth();
        this.deathLunarDay = d.lunarDay();
        this.deathLunarLeap = d.lunarLeap();
        this.memorialOverrideDay = d.memorialDay();
        this.memorialOverrideMonth = d.memorialMonth();
        this.burialPlace = d.burialPlace();
        this.updatedAt = now;
    }

    /** Nhóm "đã mất" hiện có, để so với giá trị User gửi lên (User không được đổi nhóm này, DECISIONS #76). */
    public MemberProfile.Death death() {
        return new MemberProfile.Death(deceased, deathYear, deathMonth, deathDay, deathLunarYear, deathLunarMonth,
                deathLunarDay, deathLunarLeap, memorialOverrideDay, memorialOverrideMonth, burialPlace);
    }

    /**
     * Chép email tài khoản khi liên kết (DECISIONS #81): chỉ khi hồ sơ chưa có email, một lần, không ghi đè.
     *
     * @return {@code true} nếu đã chép
     */
    public boolean fillEmailIfBlank(String accountEmail, Instant now) {
        if ((email != null && !email.isBlank()) || accountEmail == null || accountEmail.isBlank()) {
            return false;
        }
        this.email = accountEmail;
        this.updatedAt = now;
        return true;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getSearchName() {
        return searchName;
    }

    public String getTabooName() {
        return tabooName;
    }

    public Gender getGender() {
        return gender;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    /** Đổi ảnh đại diện (qua {@code /api/files/confirm}); {@code null} để gỡ ảnh. */
    public void changeAvatar(String url, Instant now) {
        this.avatarUrl = url;
        this.updatedAt = now;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getBiography() {
        return biography;
    }

    public String getLabels() {
        return labels;
    }

    public Integer getBirthYear() {
        return birthYear;
    }

    public Integer getBirthMonth() {
        return birthMonth;
    }

    public Integer getBirthDay() {
        return birthDay;
    }

    public BirthCalendar getBirthdayCalendar() {
        return birthdayCalendar;
    }

    public boolean isBirthLunarLeap() {
        return birthLunarLeap;
    }

    public boolean isDeceased() {
        return deceased;
    }

    public Integer getDeathYear() {
        return deathYear;
    }

    public Integer getDeathMonth() {
        return deathMonth;
    }

    public Integer getDeathDay() {
        return deathDay;
    }

    public Integer getDeathLunarYear() {
        return deathLunarYear;
    }

    public Integer getDeathLunarMonth() {
        return deathLunarMonth;
    }

    public Integer getDeathLunarDay() {
        return deathLunarDay;
    }

    public boolean isDeathLunarLeap() {
        return deathLunarLeap;
    }

    public Integer getMemorialOverrideDay() {
        return memorialOverrideDay;
    }

    public Integer getMemorialOverrideMonth() {
        return memorialOverrideMonth;
    }

    public String getBurialPlace() {
        return burialPlace;
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
