---
paths:
  - "apps/frontend/**"
---

# Quy tắc Frontend (React 19 · Vite · TS · Tailwind 4 · shadcn/ui)

## Cấu trúc
Cây đầy đủ ở `docs/STRUCTURE.md` §4.
```
src/
  assets/ components/{ui,shared}/ layout/ pages/ features/<module>/ hooks/ context/ services/ utils/ types/
  services/       client.ts (fetch wrapper + refresh), schema.d.ts (sinh từ shared/api/openapi.yaml, KHÔNG sửa tay)
  components/     chỉ nhận props, không gọi API, không import từ features/
  features/<module>/  api.ts · hooks.ts (TanStack Query) · schemas.ts · strings.ts · components/ · pages/
  pages/          chỉ ghép route với trang của feature, không chứa logic
  utils/          lunar/ (bản TS của lịch âm), tree/ (mô hình cây thuần), occurrences/ (lịch nhắc thuần), date, text (bỏ dấu)
  index.css       @theme tokens theo docs/DESIGN.md
```
Phụ thuộc theo chiều `pages → features → components/services/hooks/utils`. Feature không import trực tiếp feature khác. Không có `redux/`.

## Quy ước
- **Mọi việc UI bắt buộc gọi skill `ui-ux-pro-max` và tuân theo `docs/DESIGN.md`.** Không gọi được skill thì dừng và báo người dùng.
- Trước khi làm UI, đọc `docs/DESIGN.md`. Chỉ dùng token màu, font, bo góc và khoảng cách có trong đó, không viết mã hex trong component. Cần token mới thì cập nhật `DESIGN.md` trước.
- Icon dùng lucide, không dùng emoji làm icon. Mọi phần tử bấm được có `cursor-pointer`, hover/focus rõ ràng, tôn trọng `prefers-reduced-motion`.
- Ưu tiên thiết kế cho điện thoại. Chữ nền tối thiểu 16px, vùng chạm tối thiểu 44px, đạt WCAG AA. Ở mọi màn hình phải kiểm tra khổ 375px và 1280px.
- Gọi API qua `src/services/client.ts` và bọc bằng hook TanStack Query trong `features/*/hooks.ts`. Component không tự gọi `fetch`.
- **Hợp đồng trước (DECISIONS #70):** API mới thì viết vào `shared/api/openapi.yaml` trước, rồi `npm run gen:api` (`npm run lint:api` do người dùng tự chạy). Kiểu DTO **chỉ** lấy từ `schema.d.ts`. Không viết tay kiểu trùng với API.
- **Luôn gọi backend thật** (lớp giả lập đã gỡ ở Đợt 39, DECISIONS #71). Dev chạy `npm run dev` cùng BE ở `:8080`. **Không tạo dữ liệu giả** trong app: chỉ có 28 thành viên seed của BE và dữ liệu người dùng nhập.
- Logic nghiệp vụ thuần (quy tắc cây, lịch nhắc) đặt ở `utils/` dạng hàm thuần; backend có bản Java tương ứng và hai bên phải cho cùng kết quả.
- Vai trò chỉ có Admin và User; khách và tài khoản chưa duyệt xem được các trang công khai (`/`, `cay`, `thanh-vien`, `thanh-vien/:id`, `lich`, `them/doi-lich`, DECISIONS #88) và không có nút ghi nào, trang cần duyệt thì về `/cho-duyet`. Hook gọi API cần đăng nhập (`useMe`...) phải tắt khi là khách. Menu và route Quản trị chỉ cho Admin, nhưng quyền thật do backend quyết định.
- Form dùng React Hook Form + Zod. Lỗi từ `ProblemDetail.errors` được gán vào đúng trường qua `setError`.
- Access token chỉ giữ trong bộ nhớ (context), không bao giờ ghi vào `localStorage`/`sessionStorage`.- Chuỗi UI viết thẳng tiếng Việt, gom trong `features/<module>/strings.ts`. Tên component dùng PascalCase, file hook và tiện ích dùng camelCase.
- Không dùng Redux, không dùng thư viện UI khác ngoài shadcn/ui.
- Cây gia phả: thuật toán layout là **hàm thuần** trong `features/tree/layout/`. React Flow chỉ làm nhiệm vụ hiển thị.

## Kiểm tra (DECISIONS #84)
- Không viết test mới; test cũ hỏng vì đổi code thì xóa. AI không chạy lint/build/test, không mở app.
- Người dùng tự chạy `npm run lint`, `npm run build`, `npm run dev` (cùng BE đang chạy) và xem ở khổ 375px và 1280px.
