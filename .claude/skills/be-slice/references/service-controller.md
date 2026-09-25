# Mẫu DTO, mapper, service, controller (bản v2)

Tên record, trường và mã lỗi phải khớp schema trong `shared/api/openapi.yaml`.

```java
// dto/
public record MemberCreateRequest(
    @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 200) String fullName,
    Gender gender) {}                       // null = chưa rõ

public record MemberResponse(Long id, String fullName, Gender gender,
                             String phone, String email) {}   // phone/email null nếu người xem không có quyền
```

```java
// mapper/
@Mapper(componentModel = "spring")
public interface MemberMapper {
    MemberResponse toResponse(Member m);
    @Mapping(target = "id", ignore = true)
    Member toEntity(MemberCreateRequest r);
}
```

```java
// service/
@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository repo;
    private final MemberMapper mapper;
    private final AuditLogWriter audit;

    @Transactional(readOnly = true)
    public MemberResponse get(CurrentUser viewer, Long id) {
        Member m = repo.findById(id)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên"));
        MemberResponse r = mapper.toResponse(m);
        // SĐT/email chỉ cho Admin hoặc chính chủ (DECISIONS #66)
        return viewer.isAdmin() || id.equals(viewer.memberId()) ? r : r.withoutContact();
    }

    @Transactional
    public MemberResponse create(MemberCreateRequest req) {
        Member m = mapper.toEntity(req);
        m.setSearchName(TextUtils.normalize(req.fullName()));
        Member saved = repo.save(m);
        audit.write("MEMBER_CREATE", null, saved);
        return mapper.toResponse(saved);
    }
}
```

```java
// controller/
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
class MemberController {
    private final MemberService service;

    @GetMapping("/{id}")
    MemberResponse get(@PathVariable Long id, CurrentUser viewer) {   // tài khoản chưa duyệt đã bị chặn ở tầng security
        return service.get(viewer, id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<MemberResponse> create(@Valid @RequestBody MemberCreateRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }
}
```
Tên lớp tiện ích (`CurrentUser`, `TextUtils`) và chữ ký `AuditLogWriter.write` theo những gì đã có trong `common/`; chưa có thì tạo đúng chỗ theo `docs/STRUCTURE.md` §3. Import Boot 4 lấy theo phiên bản đang dùng.
