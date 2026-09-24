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
  services/       client.ts (fetch wrapper + refresh), schema.d.ts (sinh tự động, KHÔNG sửa tay)
  components/     chỉ nhận props, không gọi API, không import từ features/
  features/<module>/  api.ts · hooks.ts (TanStack Query) · schemas.ts · strings.ts · components/ · pages/
  pages/          chỉ ghép route với trang của feature, không chứa logic
  utils/          lunar/ (bản TS của lịch âm), date, text (bỏ dấu)
  index.css       @theme tokens theo docs/DESIGN.md
```
Phụ thuộc theo chiều `pages → features → components/services/hooks/utils`. Feature không import trực tiếp feature khác. Không có `redux/`.

## Quy ước
- **Mọi việc UI bắt buộc gọi skill `ui-ux-pro-max` và tuân theo `docs/DESIGN.md`.** Không gọi được skill thì dừng và báo người dùng.
- Trước khi làm UI, đọc `docs/DESIGN.md`. Chỉ dùng token màu, font, bo góc và khoảng cách có trong đó, không viết mã hex trong component. Cần token mới thì cập nhật `DESIGN.md` trước.
- Icon dùng lucide, không dùng emoji làm icon. Mọi phần tử bấm được có `cursor-pointer`, hover/focus rõ ràng, tôn trọng `prefers-reduced-motion`.
- Ưu tiên thiết kế cho điện thoại. Chữ nền tối thiểu 16px, vùng chạm tối thiểu 44px, đạt WCAG AA. Ở mọi màn hình phải kiểm tra khổ 375px và 1280px.
- Gọi API qua `src/services/client.ts` và bọc bằng hook TanStack Query trong `features/*/hooks.ts`. Component không tự gọi `fetch`.
- Kiểu DTO **chỉ** lấy từ `schema.d.ts` (`npm run gen:api` khi backend đổi API). Không viết tay kiểu trùng với backend.
- Form dùng React Hook Form + Zod. Lỗi từ `ProblemDetail.errors` được gán vào đúng trường qua `setError`.
- Access token chỉ giữ trong bộ nhớ (context), không bao giờ ghi vào `localStorage`/`sessionStorage`.
- Chuỗi UI viết thẳng tiếng Việt, gom trong `features/<module>/strings.ts`. Tên component dùng PascalCase, file hook và tiện ích dùng camelCase.
- Không dùng Redux, không dùng thư viện UI khác ngoài shadcn/ui.
- Cây gia phả: thuật toán layout là **hàm thuần** trong `features/tree/layout/` và có test Vitest. React Flow chỉ làm nhiệm vụ hiển thị.

## Xong đợt FE khi
- `npm run lint` và `npm run build` (gồm `tsc -b`) đều pass, và `npm test` pass nếu có test.
- Đã chạy app và kiểm tra ở khổ 375px và 1280px.
