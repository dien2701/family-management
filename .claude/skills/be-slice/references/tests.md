# Mẫu test

## Truy cập chéo family (bắt buộc cho mỗi endpoint mới)
```java
@SpringBootTest @AutoConfigureMockMvc
class MemberCrossFamilyTest extends AbstractIntegrationTest { // Testcontainers MySQL 8.4
    @Test
    void userOfFamilyB_cannotReadMemberOfFamilyA_returns404() throws Exception {
        Long memberIdOfA = fixtures.createMember(familyA);
        mvc.perform(get("/api/members/{id}", memberIdOfA)
                .with(jwtFor(userOfFamilyB)))
           .andExpect(status().isNotFound());   // 404, không phải 403, để không lộ sự tồn tại
    }

    @Test
    void lockedMember_isHiddenFromBusinessQueries() throws Exception {
        Long id = fixtures.createLockedMember(familyA);
        mvc.perform(get("/api/members/{id}", id).with(jwtFor(managerOfA)))
           .andExpect(status().isNotFound());
    }
}
```

## Repository
`@DataJpaTest` + `@ServiceConnection` Testcontainers, kiểm tra `...AndFamilyIdAndLockedFalse` trả rỗng khi sai family hoặc member bị khóa.

## Controller
`@WebMvcTest`: kiểm tra `@Valid` trả `ProblemDetail` có `errors[{field,message}]` tiếng Việt, và phân quyền vai trò (User gọi endpoint của Manager → 403).

## Luôn chạy
`ModularityTests` (`ApplicationModules.of(GiaPhaApplication.class).verify()`) phải pass.
