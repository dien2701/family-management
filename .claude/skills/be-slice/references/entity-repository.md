# Mẫu entity + repository (module `member`)

```java
package vn.giapha.member.entity;

@Entity
@Table(name = "member")
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "family_id", nullable = false, updatable = false)
    private Long familyId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    // Chuẩn hóa ở Service: bỏ dấu, đ -> d, chữ thường
    @Column(name = "search_name", nullable = false)
    private String searchName;

    @Column(nullable = false)
    private boolean locked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;   // DATETIME(6) UTC
    // getter/setter ...
}
```

```java
package vn.giapha.member.repository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // Truy vấn nghiệp vụ: luôn kèm familyId và locked=false
    Optional<Member> findByIdAndFamilyIdAndLockedFalse(Long id, Long familyId);
    Page<Member> findByFamilyIdAndLockedFalse(Long familyId, Pageable pageable);

    // Chỉ module admin được gọi bản này
    Optional<Member> findByIdAndFamilyId(Long id, Long familyId);
}
```
Tên cột khớp Flyway; `ddl-auto: validate` sẽ báo lệch.
