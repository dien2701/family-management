---
paths:
  - "apps/backend/**"
---

# Quy tắc Backend (Spring Boot 4.1 · Java 21 · MySQL 8.4)

## Module (Spring Modulith)
- Package gốc: `vn.giapha`. Mỗi module là một package, ví dụ `vn.giapha.member`.
- Bố cục trong module: `controller/ service/ repository/ entity/ dto/ mapper/` (thêm `validator/`, `event/` khi cần). Mọi subpackage là **nội bộ**. Cấu hình dùng chung ở `config/`, tiện ích ở `common/`. Cây đầy đủ ở `docs/STRUCTURE.md` §3.
- Module khác chỉ được gọi **facade public ở package gốc** (ví dụ `member/MemberFacade`), hoặc giao tiếp qua application event.
- `ModularityTests` (test cũ) chạy `ApplicationModules.verify()` trong CI, nên vẫn phải giữ đúng ranh giới module.

## Luồng và lớp
- `Controller → Service → Repository`. Controller chỉ map request/response và `@Valid`. Mọi logic nằm trong Service.
- DTO dùng `record`, map bằng MapStruct. **Không bao giờ** trả entity ra API.
- Lỗi nghiệp vụ ném `BusinessException(code, message)`. `GlobalExceptionHandler` chuyển thành `ProblemDetail` kèm `errors[{field,message}]`, thông báo bằng tiếng Việt. Không `catch` rồi nuốt lỗi.
- Ghi dữ liệu thì dùng `@Transactional` ở Service. Service đọc dữ liệu thì `@Transactional(readOnly = true)`.

## Phân quyền và duyệt tài khoản (bản v2, DECISIONS #54–#56, #74)
- **Không có tenant**: không có `family_id`, không lọc theo family, không có cột/bộ lọc `locked` (module `family` cũ gỡ ở Đợt 26, đừng viết code mới dựa vào nó).
- Mọi API nghiệp vụ chỉ cho tài khoản `approval_status = APPROVED` (403 `ACCOUNT_NOT_APPROVED`). Ngoại lệ: `/api/auth/**`, `GET /api/me`, `POST /api/me/consent` và các GET xem công khai trong `common/security/PublicReadPaths` (DECISIONS #88, khách cũng gọi được; service nhận người gọi `null`).
- Quyền Admin kiểm tra ở Service hoặc `@PreAuthorize`, không chỉ ở giao diện. Thao tác ghi kiểm trạng thái/vai trò **từ DB**, không chỉ tin claim (claim có thể cũ 15 phút).
- Quyền tự quản hồ sơ của User (#75, #76, #78) và phạm vi đề xuất chỉ EVENT (#77) kiểm tra ở backend. SĐT/email của thành viên chỉ trả cho Admin và chính chủ (`user.member_id`).
- Mỗi endpoint mới (không nằm trong `PublicReadPaths`) phải chặn: chưa đăng nhập → 401, chưa duyệt → 403 `ACCOUNT_NOT_APPROVED`, User gọi API của Admin → 403 (không cần viết test, #84).

## Hợp đồng API
- `shared/api/openapi.yaml` là nguồn sự thật (DECISIONS #70). Controller, DTO và mã lỗi phải khớp hợp đồng; muốn đổi thì sửa `openapi.yaml` trước (và frontend chạy lại `gen:api`).
- Hành vi phải khớp bản TS của quy tắc ở frontend (`utils/tree`, `utils/occurrences`, seed `shared/fixtures/seed`). Chỗ nào lệch IDEA/DECISIONS thì theo IDEA/DECISIONS và ghi lại.

## Dữ liệu
- Schema do Flyway quản lý: `src/main/resources/db/migration/V{n}__{snake_case}.sql`. **Không sửa file V đã có.** Hibernate chạy `ddl-auto: validate`.
- ID dùng `BIGINT AUTO_INCREMENT`. Thời điểm lưu `DATETIME(6)` UTC ↔ `Instant`. Ngày gia phả lưu dạng số (`*_year/_month/_day`).
- Charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`. Tìm tên không dấu qua cột `search_name`, do Service chuẩn hóa: bỏ dấu, `đ` thành `d`, chuyển chữ thường.
- Thay đổi dữ liệu gia phả, thao tác dựng cây và thao tác quản trị thì gọi `AuditLogWriter` (module `common`) để ghi `before`/`after`. Xóa thành viên thì lưu snapshot đầy đủ.
- Seed 28 thành viên là migration **sinh bằng script** từ `shared/fixtures/seed/members.json`, không sửa tay.

## Test (DECISIONS #84)
- Không viết test mới. Test cũ (JUnit 5 + Testcontainers, không H2) vẫn chạy trong CI; đổi code làm test cũ hỏng thì xóa test đó.
- AI không chạy `mvnw`. Người dùng tự chạy `.\mvnw.cmd compile` (hoặc `verify` khi muốn chạy test cũ, cần Docker).
