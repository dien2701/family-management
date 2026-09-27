---
name: flyway-migration
description: Tạo migration Flyway mới và sửa entity JPA cho khớp. Dùng khi cần thêm bảng, thêm/đổi cột, thêm index hoặc ràng buộc trong apps/backend, khi người dùng nói "thêm cột", "tạo bảng", "đổi schema", "migration", "file V", hoặc khi sửa entity mà DB chưa có cột tương ứng. Không bao giờ sửa file V đã có.
---

# Flyway migration

Hibernate chạy `ddl-auto: validate`, nên entity và SQL phải khớp từng cột. File V đã chạy không được sửa: Flyway kiểm tra checksum, sửa sẽ làm hỏng mọi DB đã migrate.

## Các bước

1. **Lấy số V tiếp theo:** chạy `powershell -File .claude/skills/flyway-migration/scripts/next-version.ps1` (in ra số n kế tiếp). Không tự đoán số.
2. **Tạo** `apps/backend/src/main/resources/db/migration/V{n}__{snake_case}.sql`. Tên mô tả việc làm, ví dụ `V3__add_member_birth_lunar_leap.sql`.
3. **Viết SQL theo quy ước** (DECISIONS #10–12, `.claude/rules/backend.md`):
   - ID `BIGINT AUTO_INCREMENT`, khóa ngoại tường minh, đặt tên index `idx_<bảng>_<cột>`.
   - Thời điểm `DATETIME(6)` (UTC). Ngày gia phả lưu số `*_year/_month/_day`.
   - `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`.
   - Bản v2 **không có tenant**: không thêm cột `family_id`, không có cột `locked*` (DECISIONS #54, #63).
   - Seed dữ liệu (28 thành viên) phải **sinh bằng script** từ `shared/fixtures/seed/members.json`, không viết tay.
   - Không lưu SĐT/email vào bảng log. Không dữ liệu bí mật trong seed.
   - Thêm cột NOT NULL vào bảng đã có dữ liệu thì cho `DEFAULT` hoặc làm 2 bước.
4. **Sửa entity** (`entity/`) khớp tên cột, kiểu, nullability. Cập nhật DTO/mapper nếu lộ ra API; nếu API đổi thì sửa `shared/api/openapi.yaml` trước rồi `npm run gen:api` ở frontend.
5. **Kiểm tra:** AI không chạy (DECISIONS #84); nhắc người dùng chạy backend (`spring-boot:run`) để Flyway áp dụng file V và `validate` báo lệch entity. Có lỗi thì tạo file V **mới** để sửa nếu file trước đã chạy trên DB dùng chung; nếu file V vừa tạo chưa từng chạy ở đâu ngoài máy này thì được chỉnh lại.
6. Ghi việc đổi schema vào mục ✅ Đã làm của đợt.

Hook trong `.claude/settings.json` sẽ chặn ghi vào file V đã có; nếu bị chặn, đó là dấu hiệu cần file V mới.
