# Dữ liệu ban đầu: 28 thành viên

Nguồn duy nhất của dữ liệu ban đầu (DECISIONS #68). Frontend đọc file này ở chế độ giả lập (Đợt 9).
Backend nạp bằng một migration Flyway **sinh từ chính file này** (Đợt 27), có test đối chiếu số lượng và nội dung.

## Nguồn

`roadmap/IDEA.md`, Phụ lục A: danh sách viết tay do người dùng cung cấp ngày 2026-09-25 (27 dòng, riêng dòng 27
tách thành 2 người nên có 28 người). Test `apps/frontend/src/services/mock/seed.test.ts` đọc lại bảng ở Phụ lục A
và so với file này.

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
