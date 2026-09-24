# Mẫu DTO, mapper, service, controller

```java
// dto/
public record MemberCreateRequest(
    @NotBlank(message = "Vui lòng nhập họ tên") @Size(max = 120) String fullName,
    @NotNull(message = "Vui lòng chọn giới tính") Gender gender) {}

public record MemberResponse(Long id, String fullName, Gender gender, boolean locked) {}
```

```java
// mapper/
@Mapper(componentModel = "spring")
public interface MemberMapper {
    MemberResponse toResponse(Member m);
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "familyId", ignore = true)
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
    public MemberResponse get(Long familyId, Long id) {
        return repo.findByIdAndFamilyIdAndLockedFalse(id, familyId)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException("MEMBER_NOT_FOUND", "Không tìm thấy thành viên")); // 404
    }

    @Transactional
    public MemberResponse create(Long familyId, MemberCreateRequest req) {
        Member m = mapper.toEntity(req);
        m.setFamilyId(familyId);
        m.setSearchName(TextUtils.normalize(req.fullName()));
        Member saved = repo.save(m);
        audit.write("MEMBER_CREATE", familyId, null, saved);
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
    MemberResponse get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.get(FamilyContext.familyId(jwt), id);   // familyId từ token
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    ResponseEntity<MemberResponse> create(@Valid @RequestBody MemberCreateRequest req,
                                          @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(201).body(service.create(FamilyContext.familyId(jwt), req));
    }
}
```
Tên lớp tiện ích (`FamilyContext`, `TextUtils`) theo những gì đã có trong `common/`; chưa có thì tạo đúng chỗ theo `docs/STRUCTURE.md` §3. Import Boot 4 lấy theo phiên bản đang dùng.
