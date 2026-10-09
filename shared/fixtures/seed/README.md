# Dữ liệu ban đầu: 28 thành viên

Nguồn duy nhất của dữ liệu ban đầu (DECISIONS #68). Frontend không còn đọc file này (lớp giả lập đã gỡ ở Đợt 39); script `apps/frontend/scripts/import-mock-data.ts` dùng nó để nhận ra 28 người seed.
Backend nạp bằng một migration Flyway **sinh từ chính file này** (Đợt 27, `V7__seed_members.sql`).

## Nguồn

`roadmap/IDEA.md`, Phụ lục A: danh sách viết tay do người dùng cung cấp ngày 2026-09-25 (27 dòng, riêng dòng 27
tách thành 2 người nên có 28 người). 

## Quy ước

- `members.json` là mảng 28 phần tử, **đúng thứ tự Phụ lục A** (27a, 27b là hai phần tử cuối). Không có `id` trong
  file: id là số thứ tự bắt đầu từ 1 (1 = "Cụ Nguyễn Văn Tham (Tức Cụ Kai)", 28 = "Cậu bé đỏ"). Frontend và backend
  đều gán id theo thứ tự này.
- `fullName` ghi nguyên văn. Chỉ bỏ khoảng trắng thừa (ví dụ "( Tức" thành "(Tức"). Không tách hay thêm tiền tố.
- Mọi người: `isDeceased: true` và `burialPlace` là "Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội".
- `deathLunar { day, month, leap, year? }`: ngày mất **âm**, `leap` luôn `false`. Người chưa rõ ngày mất thì không có
  khóa này. "Cụ Nguyễn Thị Thêm" chỉ có ngày/tháng âm (01/11), không có `year`.
- `deathSolar { year, month, day }`: ngày dương **tính sẵn** bằng `apps/frontend/src/utils/lunar` (`toSolar`), chỉ có khi
  `deathLunar` có `year`. Test `seed.test.ts` tính lại và so.
- Mọi trường khác (giới tính, ngày sinh, SĐT, email, ảnh, người thân, vị trí trên cây...) **để trống**, nên không xuất
  hiện trong file. Người dùng tự bổ sung sau. Không được thêm dữ liệu bịa vào file này.

## Sinh migration cho backend

`V7__seed_members.sql` do script `to-sql.mjs` sinh từ `members.json`. **Không sửa file SQL bằng tay**: sửa `members.json`
rồi chạy lại (Node 24, từ thư mục gốc repo):

```bash
node shared/fixtures/seed/to-sql.mjs
```

Script ghi thẳng vào `apps/backend/src/main/resources/db/migration/V7__seed_members.sql` (truyền đường dẫn khác làm
tham số nếu cần), gán `id` theo thứ tự trong `members.json`, chuẩn hóa `search_name` giống `SearchText` của backend
và báo lỗi nếu gặp trường chưa được hỗ trợ hoặc ngày mất thiếu một trong hai lịch. Flyway kiểm checksum nên **chỉ sinh
lại khi chưa có môi trường nào đã chạy V7**; đã chạy rồi thì thêm một file V mới để sửa dữ liệu.
