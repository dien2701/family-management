---
paths:
  - "apps/backend/**"
---

# Quy tắc Backend (Spring Boot 4.1 · Java 21 · MySQL 8.4)

## Module (Spring Modulith)
- Package gốc: `vn.giapha`. Mỗi module là một package, ví dụ `vn.giapha.member`.
- Bố cục trong module: `controller/ service/ repository/ entity/ dto/ mapper/` (thêm `validator/`, `event/` khi cần). Mọi subpackage là **nội bộ**. Cấu hình dùng chung ở `config/`, tiện ích ở `common/`. Cây đầy đủ ở `docs/STRUCTURE.md` §3.
- Module khác chỉ được gọi **facade public ở package gốc** (ví dụ `member/MemberFacade`), hoặc giao tiếp qua application event.
- Test `ModularityTests` chạy `ApplicationModules.of(GiaPhaApplication.class).verify()` và phải luôn pass.

## Luồng và lớp
- `Controller → Service → Repository`. Controller chỉ map request/response và `@Valid`. Mọi logic nằm trong Service.
- DTO dùng `record`, map bằng MapStruct. **Không bao giờ** trả entity ra API.
- Lỗi nghiệp vụ ném `BusinessException(code, message)`. `GlobalExceptionHandler` chuyển thành `ProblemDetail` kèm `errors[{field,message}]`, thông báo bằng tiếng Việt. Không `catch` rồi nuốt lỗi.
- Ghi dữ liệu thì dùng `@Transactional` ở Service. Service đọc dữ liệu thì `@Transactional(readOnly = true)`.

## Multi-tenant và khóa
- `familyId` **luôn lấy từ token**, hoặc từ ngữ cảnh Admin đã chọn. Không tin `familyId` gửi lên từ client.
- Repository viết tường minh `...AndFamilyId(...)`. **Không dùng Hibernate `@Filter`.**
- Truy vấn nghiệp vụ trên `member` mặc định kèm `locked = false`. Chỉ module `admin` được đọc member đang bị khóa.
- Mỗi endpoint mới phải có test **truy cập chéo family** trả về 404.

## Dữ liệu
- Schema do Flyway quản lý: `src/main/resources/db/migration/V{n}__{snake_case}.sql`. **Không sửa file V đã có.** Hibernate chạy `ddl-auto: validate`.
- ID dùng `BIGINT AUTO_INCREMENT`. Thời điểm lưu `DATETIME(6)` UTC ↔ `Instant`. Ngày gia phả lưu dạng số (`*_year/_month/_day`).
- Charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`. Tìm tên không dấu qua cột `search_name`, do Service chuẩn hóa: bỏ dấu, `đ` thành `d`, chuyển chữ thường.
- Thay đổi dữ liệu gia phả thì gọi `AuditLogWriter` (module `common`) để ghi `before`/`after`.

## Test
- JUnit 5 + Testcontainers MySQL 8.4 (`@ServiceConnection`). Không dùng H2.
- Test lát cắt: `@WebMvcTest` cho controller, `@DataJpaTest` + Testcontainers cho repository, `@SpringBootTest` cho luồng chính.
- Lệnh: `./mvnw verify` (Windows: `.\mvnw.cmd verify`). **Đợt BE chỉ được coi là xong khi lệnh này pass.**
