# Mẫu test (bản v2)

## Phân quyền và duyệt (bắt buộc cho mỗi endpoint mới, DECISIONS #74)
```java
@SpringBootTest @AutoConfigureMockMvc
class MemberAccessTest extends AbstractIntegrationTest { // Testcontainers MySQL 8.4
    @Test
    void anonymous_returns401() throws Exception {
        mvc.perform(get("/api/members")).andExpect(status().isUnauthorized());
    }

    @Test
    void waitingAccount_returns403NotApproved() throws Exception {
        mvc.perform(get("/api/members").with(jwtFor(waitingUser)))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_APPROVED"));
    }

    @Test
    void user_cannotCreateMember_returns403() throws Exception {
        mvc.perform(post("/api/members").with(jwtFor(approvedUser))
                .contentType(APPLICATION_JSON).content("{\"fullName\":\"A\"}"))
           .andExpect(status().isForbidden());
    }

    @Test
    void user_cannotSeeContactOfOthers() throws Exception {
        Long id = fixtures.createMember("Cụ Nguyễn Văn Tỵ", "0900000000");
        mvc.perform(get("/api/members/{id}", id).with(jwtFor(approvedUser)))
           .andExpect(jsonPath("$.phone").doesNotExist());
    }
}
```

## Hợp đồng
`ContractTest` (từ Đợt 26) so `/v3/api-docs` với `shared/api/openapi.yaml`. Làm xong endpoint thì bỏ khỏi `NOT_YET_IMPLEMENTED`.

## Fixture dùng chung
Logic có bản TS ở frontend (cây, lịch nhắc, seed) phải có test chạy toàn bộ fixture trong `shared/fixtures/<tên>/` và cho kết quả giống hệt.

## Controller
`@WebMvcTest`: kiểm tra `@Valid` trả `ProblemDetail` có `errors[{field,message}]` tiếng Việt.

## Luôn chạy
`ModularityTests` (`ApplicationModules.of(GiaPhaApplication.class).verify()`) phải pass.
