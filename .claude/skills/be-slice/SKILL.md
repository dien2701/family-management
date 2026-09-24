---
name: be-slice
description: Thêm một lát cắt (entity → repository → service → controller → DTO → mapper → test) vào một module backend Spring Modulith. Dùng khi làm đợt BE và cần thêm endpoint/chức năng mới trong apps/backend, khi người dùng nói "thêm API", "thêm endpoint", "thêm module", "lát cắt BE", "CRUD cho X". Đảm bảo cách ly family, loại member bị khóa, DTO record + MapStruct và test truy cập chéo family.
---

# Lát cắt backend

Một lát cắt là phần nhỏ nhất chạy được từ API tới DB. Làm đủ các lớp và test trong một lần để không sót cách ly dữ liệu giữa các family (lỗi này rất khó thấy sau này).

Đọc trước: `.claude/rules/backend.md`, `.claude/rules/security.md`, mục § liên quan trong `roadmap/IDEA.md`. Mẫu code ở `references/` (đọc khi bắt đầu viết từng lớp).

## Các bước

1. **Xác định module** (`vn.giapha.<module>`) và endpoint. Chỉ làm trong phạm vi đợt. Chưa rõ nghiệp vụ thì hỏi người dùng, không giả định.
2. **Schema:** cần bảng/cột mới thì gọi skill `flyway-migration` trước.
3. **Entity** (`entity/`) khớp SQL. **Repository** (`repository/`): mọi truy vấn có `...AndFamilyId(...)`; với `member` thêm `AndLockedFalse`. Không dùng `@Filter`, không dùng `findById` trần cho dữ liệu theo family. Mẫu: `references/entity-repository.md`.
4. **DTO** (`dto/`) là `record` kèm Bean Validation, thông báo tiếng Việt. **Mapper** (`mapper/`) bằng MapStruct. Không trả entity ra API; không có `password_hash`, `google_sub`, hash token/OTP; SĐT/email chỉ cho Admin, Manager hoặc chính chủ.
5. **Service** (`service/`): `@Transactional` khi ghi, `@Transactional(readOnly = true)` khi đọc. `familyId` lấy từ token (hoặc ngữ cảnh Admin), không nhận từ client. Lỗi nghiệp vụ ném `BusinessException`. Đổi dữ liệu gia phả thì gọi `AuditLogWriter` với `before/after`. Mẫu: `references/service-controller.md`.
6. **Controller** (`controller/`) chỉ map request/response và `@Valid`. Phân quyền theo vai trò (Admin/Manager/User).
7. **Ranh giới module:** module khác chỉ gọi facade ở package gốc (ví dụ `MemberFacade`); muốn lộ chức năng cho module khác thì thêm facade, không import subpackage của module khác.
8. **Test** (mẫu `references/tests.md`): service/logic, controller (`@WebMvcTest`), repository (Testcontainers MySQL 8.4, không H2), và **bắt buộc** test truy cập chéo family trả 404 cho mỗi endpoint mới. `ModularityTests` phải pass.
9. **Xác nhận:** `.\mvnw.cmd verify` pass. Đổi API thì nhắc chạy `npm run gen:api` ở frontend. Rồi gọi `code-review` (thêm `security-review` nếu đụng auth/khóa nhánh/AI).
