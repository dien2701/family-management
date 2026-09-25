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
  services/       client.ts (fetch wrapper + refresh), schema.d.ts (sinh từ shared/api/openapi.yaml, KHÔNG sửa tay),
                  mock/ (lớp giả lập GĐ A: router, store localStorage, handler theo module; gỡ ở Đợt 39)
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
- **Hợp đồng trước (DECISIONS #70):** API mới thì viết vào `shared/api/openapi.yaml` trước, `npm run lint:api`, rồi `npm run gen:api`. Kiểu DTO **chỉ** lấy từ `schema.d.ts`. Không viết tay kiểu trùng với API.
- **Chế độ giả lập (#71, #72):** mỗi feature thêm handler cho endpoint của mình trong `services/mock/handlers/<module>.ts`. Handler áp đúng quy tắc nghiệp vụ, phân quyền và trả `ProblemDetail` như backend. Endpoint không có handler thì gọi backend thật. Mã mock không được lọt vào bản build prod. **Không tạo dữ liệu giả**: chỉ có 28 thành viên ở `shared/fixtures/seed/members.json` và dữ liệu người dùng nhập. Phần cần máy chủ (AI, push, upload, file BE) hiện "Cần kết nối máy chủ".
- Logic nghiệp vụ dùng chung giữa handler giả lập và UI (quy tắc cây, lịch nhắc) đặt ở `utils/` dạng hàm thuần, có test chạy fixture trong `shared/fixtures/`.
- Vai trò chỉ có Admin và User; tài khoản chưa duyệt chỉ vào được `/cho-duyet`. Menu và route Quản trị chỉ cho Admin, nhưng quyền thật do backend (hoặc handler giả lập) quyết định.
- Form dùng React Hook Form + Zod. Lỗi từ `ProblemDetail.errors` được gán vào đúng trường qua `setError`.
- Access token chỉ giữ trong bộ nhớ (context), không bao giờ ghi vào `localStorage`/`sessionStorage`. (Store của lớp giả lập trong localStorage chỉ chứa dữ liệu gia phả, không chứa token.)
- Chuỗi UI viết thẳng tiếng Việt, gom trong `features/<module>/strings.ts`. Tên component dùng PascalCase, file hook và tiện ích dùng camelCase.
- Không dùng Redux, không dùng thư viện UI khác ngoài shadcn/ui.
- Cây gia phả: thuật toán layout là **hàm thuần** trong `features/tree/layout/` và có test Vitest. React Flow chỉ làm nhiệm vụ hiển thị.

## Xong đợt FE khi
- `npm run lint` và `npm run build` (gồm `tsc -b`) đều pass, và `npm test` pass nếu có test.
- Đã chạy app (GĐ A: `npm run dev:mock`) và kiểm tra ở khổ 375px và 1280px.
