---
name: be-slice
description: Thêm một lát cắt (entity → repository → service → controller → DTO → mapper) vào một module backend Spring Modulith. Dùng khi làm đợt BE và cần thêm endpoint/chức năng mới trong apps/backend, khi người dùng nói "thêm API", "thêm endpoint", "thêm module", "lát cắt BE", "CRUD cho X". Đảm bảo khớp hợp đồng shared/api/openapi.yaml, chặn tài khoản chưa duyệt, phân quyền Admin/User, DTO record + MapStruct. Không viết test (DECISIONS #84).
---

# Lát cắt backend

Một lát cắt là phần nhỏ nhất chạy được từ API tới DB. Làm đủ các lớp trong một lần để không sót phân quyền hay lệch hợp đồng API (lỗi này rất khó thấy sau này).

Đọc trước: `.claude/rules/backend.md`, `.claude/rules/security.md`, mục § liên quan trong `roadmap/IDEA.md` (bản v2), DECISIONS mục J, và phần của endpoint trong `shared/api/openapi.yaml`. Mẫu code ở `references/` (đọc khi bắt đầu viết từng lớp).

## Các bước

1. **Xác định module** (`vn.giapha.<module>`) và endpoint **đã có trong `shared/api/openapi.yaml`** (path, tham số, body, mã lỗi). Chỉ làm trong phạm vi đợt. Chưa rõ nghiệp vụ thì hỏi người dùng, không giả định.
2. **Schema:** cần bảng/cột mới thì gọi skill `flyway-migration` trước.
3. **Entity** (`entity/`) khớp SQL. **Repository** (`repository/`): truy vấn tường minh, không có `family_id` hay `locked` (bản v2 không có tenant). Mẫu: `references/entity-repository.md`.
4. **DTO** (`dto/`) là `record` kèm Bean Validation, thông báo tiếng Việt. **Mapper** (`mapper/`) bằng MapStruct. Không trả entity ra API; không có `password_hash`, `google_sub`, hash token/OTP; SĐT/email chỉ cho Admin hoặc chính chủ. Tên trường và kiểu phải khớp schema trong `openapi.yaml`.
5. **Service** (`service/`): `@Transactional` khi ghi, `@Transactional(readOnly = true)` khi đọc. Thao tác ghi kiểm vai trò và trạng thái duyệt từ DB, không chỉ tin claim. Lỗi nghiệp vụ ném `BusinessException` với mã lỗi đúng như hợp đồng. Đổi dữ liệu gia phả thì gọi `AuditLogWriter` với `before/after`. Mẫu: `references/service-controller.md`.
6. **Controller** (`controller/`) chỉ map request/response và `@Valid`. Phân quyền theo vai trò (Admin/User) bằng `@PreAuthorize` hoặc ở Service.
7. **Ranh giới module:** module khác chỉ gọi facade ở package gốc (ví dụ `MemberFacade`); muốn lộ chức năng cho module khác thì thêm facade, không import subpackage của module khác.
8. **Không viết test, không chạy `mvnw`, không review** (DECISIONS #84). Mỗi endpoint vẫn phải chặn 401 / 403 `ACCOUNT_NOT_APPROVED` / 403 User gọi API Admin ở code. Muốn đổi API thì sửa `openapi.yaml` trước và nhắc chạy `npm run gen:api` ở frontend. Cuối đợt in khối hướng dẫn thủ công theo ROADMAP.
