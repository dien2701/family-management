---
name: fe-feature
description: Nối một module frontend (React) với API backend theo cấu trúc features/<module>. Dùng khi làm đợt FE trong apps/frontend, khi người dùng nói "làm màn hình", "nối API", "thêm trang", "form", "danh sách", "feature FE", hoặc khi thêm bất kỳ UI mới nào. Bắt buộc gọi skill ui-ux-pro-max và tuân theo docs/DESIGN.md.
---

# Feature frontend

Một feature gom toàn bộ phần FE của một module (API, hook, form, chuỗi, component, trang) để phụ thuộc chỉ đi một chiều `pages → features → components/services/hooks/utils`. Đọc `.claude/rules/frontend.md` và `docs/STRUCTURE.md` §4 trước.

## Các bước

1. **Bắt buộc gọi skill `ui-ux-pro-max`** qua công cụ Skill và đọc `docs/DESIGN.md`. Không gọi được thì dừng và báo người dùng. Chỉ dùng token, font, bo góc, khoảng cách trong DESIGN.md; không viết hex trong component. Cần token mới thì cập nhật DESIGN.md trước.
2. **Xác nhận API đã có** và `npm run gen:api` đã sinh `src/services/schema.d.ts`. Kiểu DTO chỉ lấy từ đó (`components["schemas"]["..."]`), không viết tay. API chưa có thì báo, không tự chế.
3. **Tạo `src/features/<module>/`** (mẫu ở `references/`):
   - `api.ts`: hàm gọi qua `services/client.ts`, không `fetch` trực tiếp.
   - `hooks.ts`: TanStack Query (`useQuery`/`useMutation`), query key theo module, mutation invalidate đúng key.
   - `schemas.ts`: Zod 4 cho form, thông báo lỗi tiếng Việt.
   - `strings.ts`: mọi chuỗi UI tiếng Việt của feature.
   - `components/`, `pages/`: component và trang của feature.
4. **Form:** React Hook Form + Zod; lỗi từ `ProblemDetail.errors` gán vào đúng trường bằng `setError`. Nhãn luôn hiện, lỗi ngay dưới trường.
5. **Trang** trong `src/pages/` chỉ ghép route với trang của feature, không chứa logic. Đăng ký route ở router.
6. **UI:** ưu tiên điện thoại (375px), chữ nền ≥ 16px, vùng chạm ≥ 44px, danh sách = thẻ trên mobile / bảng trên desktop, trạng thái rỗng có hành động gợi ý, có trạng thái loading và lỗi. Icon lucide, không emoji. Access token chỉ ở bộ nhớ.
7. **Xác nhận:** `npm run lint`, `npm run build`, `npm test` (nếu có test) pass; chạy app bằng skill `run` và kiểm tra ở 375px và 1280px. Feature không import trực tiếp feature khác.
