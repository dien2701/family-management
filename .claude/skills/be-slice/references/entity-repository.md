# Mẫu entity + repository (module `member`, bản v2 — không có tenant)

```java
package vn.giapha.member.entity;

@Entity
@Table(name = "member")
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Họ tên ghi nguyên văn (có thể có "Cụ", "(Tức …)"), trường bắt buộc duy nhất
    @Column(name = "full_name", nullable = false)
    private String fullName;

    // Chuẩn hóa ở Service: bỏ dấu, đ -> d, chữ thường
    @Column(name = "search_name", nullable = false)
    private String searchName;

    // Được để trống: không tự đặt giới tính
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;   // DATETIME(6) UTC
    // getter/setter ...
}
```

```java
package vn.giapha.member.repository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // Tìm không dấu: so với search_name đã chuẩn hóa
    Page<Member> findBySearchNameContaining(String normalizedQuery, Pageable pageable);
}
```
Tên cột khớp Flyway; `ddl-auto: validate` sẽ báo lệch. Không thêm `family_id` hay cột `locked` (DECISIONS #54, #63).
