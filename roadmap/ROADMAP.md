# ROADMAP — Tộc Phả

> Đầu mỗi phiên đọc `CLAUDE.md` và file này. Mỗi phiên **chỉ làm một đợt**, xong thì DỪNG.
> Đặc tả nằm ở `roadmap/IDEA.md` (**bản chốt v2**), quyết định kỹ thuật ở `docs/DECISIONS.md` (thắng IDEA khi có mâu thuẫn; **mục J #54–#74 là đổi hướng v2**), giao diện ở `docs/DESIGN.md`.
> **Đổi hướng v2 (2026-09-25):**
> - Bỏ dòng họ, chỉ còn một gia phả chung. Chỉ còn hai vai trò Admin và User, tài khoản mới phải được Admin duyệt.
> - Cây do Admin dựng tay.
> - **Hồ sơ tự quản (DECISIONS mục K #75–#78):** mỗi hồ sơ có danh sách **người thân** một chiều (thành viên đã có + nhãn). User đã liên kết tự sửa trực tiếp hồ sơ, người thân và ảnh đại diện của mình, trừ các trường về việc đã mất (chỉ Admin). Đề xuất chỉ còn cho sự kiện chung.
> - **Làm toàn bộ frontend trước** (dùng chế độ giả lập với dữ liệu thật của 28 thành viên), sau đó mới làm backend.
>
> Đợt 0–7 đã xong theo kế hoạch cũ và được giữ nguyên để tra cứu. Từ Đợt 8 trở đi là kế hoạch mới.

## Quy tắc
- Mỗi đợt làm **tối đa 1 module**, vừa **một phiên**, và phải có **kết quả chạy được**.
- **Thứ tự (DECISIONS #69):** Đợt 8 (backend nhỏ) → **GĐ A: toàn bộ frontend** → **GĐ B: toàn bộ backend** → **GĐ C: nối, E2E, deploy**.
- **Hợp đồng trước (#70):** đợt FE nào đụng API mới thì viết phần hợp đồng trong `shared/api/openapi.yaml` trước, chạy `npm run gen:api`, rồi mới làm UI. Đợt BE phải khớp hợp đồng đã có. Muốn đổi thì sửa `openapi.yaml` trước và ghi vào ✅ Đã làm.
- **Giả lập (#71, #72):** ở GĐ A, frontend chạy bằng `VITE_API_MODE=mock`. Mỗi đợt FE thêm handler giả lập cho endpoint của module mình. Không tạo dữ liệu giả.
- **Định nghĩa xong:**
  - BE: `.\mvnw.cmd verify` pass, gồm test Modulith, test phân quyền và test tài khoản chưa duyệt (#74). Từ Đợt 26 có thêm test hợp đồng.
  - FE: `npm run lint` và `npm run build` pass (`npm test` pass nếu có test). Đã chạy app (GĐ A chạy ở chế độ giả lập) và kiểm tra ở khổ 375px và 1280px.
- **Khi xong một đợt:**
  - đổi `- [ ]` thành `- [x]` kèm ngày (ví dụ `- [x] … ✅ 2026-10-02`);
  - đổi ⬜ ở tiêu đề thành `✅ YYYY-MM-DD`;
  - điền mục **✅ Đã làm**, cập nhật 🔧 và 🧪 nếu thực tế khác dự kiến;
  - **in ra khung chat** (không chỉ nằm trong file) mục **➡️ Đợt tiếp** của đợt vừa xong, theo đúng mẫu dưới đây, rồi DỪNG. Không tự bắt đầu đợt kế.
- **Mẫu hiển thị "Đợt tiếp" cuối mỗi đợt** (bắt buộc, đợt cuối lộ trình thì thay bằng dòng "Hết lộ trình"):

  ````text
  ➡️ Đợt tiếp: Đợt N — <Tên đợt>
  Model gợi ý: <Sonnet|Opus> · Effort: <low|medium|high> · Skill: <skill 1>, <skill 2>
  Lý do (nếu khác mặc định): <một dòng, ví dụ "đợt khó: cây gia phả">

  ```text
  <nguyên văn prompt của đợt kế, copy từ mục ➡️ của đợt vừa xong>
  ```
  ````

  Model · Effort phải khớp cột "Model · Effort" ở bảng Tiến độ; skill phải khớp bảng skill bên dưới và dòng "BẮT BUỘC gọi…" trong prompt. Có lệch thì sửa cho khớp trước khi in.
- **Model:** mặc định Sonnet. Chỉ dùng Opus cho đợt kiến trúc hoặc đợt khó: hợp đồng + giả lập, cây gia phả.
- **Skill bắt buộc theo loại đợt:**

| Loại đợt | Skill |
|---|---|
| BE thường | `code-review` |
| Auth, tài khoản, quản trị, upload, AI | `security-review` + `code-review` |
| FE | `ui-ux-pro-max` + `run` |
| Có số liệu hoặc biểu đồ | thêm `dataviz` |
| Export | thêm `anthropic-skills:xlsx` và/hoặc `anthropic-skills:pdf` |

## Tiến độ

| Đợt | Tên | Module | Model · Effort | Trạng thái |
|---|---|---|---|---|
| **Đã xong** | **Nền tảng (kế hoạch cũ)** | | | |
| 0 | Nền tảng Backend | setup | Sonnet · high | ✅ 2026-09-25 |
| 1 | Nền tảng Frontend | setup | Sonnet · high | ✅ 2026-09-25 |
| 2 | Auth BE | auth | Sonnet · high | ✅ 2026-09-25 |
| 3 | Auth FE | auth | Sonnet · high | ✅ 2026-09-25 |
| 4 | Dòng họ BE *(sẽ gỡ ở Đợt 26)* | family | Sonnet · medium | ✅ 2026-09-25 |
| 5 | Dòng họ FE *(sẽ gỡ ở Đợt 10)* | family | Sonnet · medium | ✅ 2026-09-25 |
| 6 | Lịch âm BE | calendar | **Opus · high** | ✅ 2026-09-25 |
| 7 | Lịch âm FE | calendar | Sonnet · high | ✅ 2026-09-25 |
| **Chuẩn bị** | | | | |
| 8 | Tài khoản BE: Admin gốc, duyệt, consent | auth | Sonnet · high | ⬜ |
| **GĐ A** | **Frontend (chế độ giả lập)** | | | |
| 9 | Hợp đồng API, dữ liệu 28 người, lớp giả lập | contract | **Opus · high** | ⬜ |
| 10 | FE tài khoản: gỡ dòng họ, chờ duyệt, quản lý tài khoản | auth/admin | Sonnet · high | ⬜ |
| 11 | Thành viên FE: danh sách, chi tiết | member | Sonnet · high | ⬜ |
| 12 | Thành viên FE: form, xóa, ảnh đại diện | member | Sonnet · high | ⬜ |
| 13 | Người thân, "Tôi là ai" và tự sửa hồ sơ FE | member | Sonnet · high | ⬜ |
| 14 | Cây FE: mô hình và thuật toán layout | tree | **Opus · high** | ⬜ |
| 15 | Cây FE: hiển thị và thêm người | tree | **Opus · high** | ⬜ |
| 16 | Cây FE: chỉnh sửa và điều hướng | tree | **Opus · high** | ⬜ |
| 17 | Lịch và sự kiện FE | calendar/event | Sonnet · high | ⬜ |
| 18 | Dashboard FE | dashboard | Sonnet · medium | ⬜ |
| 19 | PWA | pwa | Sonnet · medium | ⬜ |
| 20 | Đề xuất sự kiện FE | proposal | Sonnet · medium | ⬜ |
| 21 | Thông báo FE | notification | Sonnet · high | ⬜ |
| 22 | Đính kèm FE | file | Sonnet · medium | ⬜ |
| 23 | Quản trị FE: hàng đợi, đã xóa, cấu hình | admin | Sonnet · medium | ⬜ |
| 24 | Trợ lý AI FE | ai | Sonnet · high | ⬜ |
| 25 | Export FE và in cây khổ lớn | report | Sonnet · high | ⬜ |
| **GĐ B** | **Backend** | | | |
| 26 | Gỡ dòng họ BE và test hợp đồng | auth/common | Sonnet · high | ⬜ |
| 27 | Thành viên BE + seed 28 người | member | Sonnet · high | ⬜ |
| 28 | Người thân, "Tôi là ai" và tự sửa hồ sơ BE | member | Sonnet · high | ⬜ |
| 29 | Cây BE | tree | **Opus · high** | ⬜ |
| 30 | Upload và đính kèm BE | file | Sonnet · high | ⬜ |
| 31 | Sự kiện chung và lịch nhắc BE | event/calendar | Sonnet · high | ⬜ |
| 32 | Dashboard và quản trị BE | admin | Sonnet · medium | ⬜ |
| 33 | Đề xuất sự kiện BE | proposal | Sonnet · medium | ⬜ |
| 34 | Thông báo BE: hộp thư, tùy chọn | notification | Sonnet · medium | ⬜ |
| 35 | Web Push BE | notification | Sonnet · high | ⬜ |
| 36 | AI BE: provider, tool, SSE, quota | ai | Sonnet · high | ⬜ |
| 37 | AI BE: soạn đề xuất sự kiện, phạm vi | ai | Sonnet · high | ⬜ |
| 38 | Export BE (Excel, PDF) | report | Sonnet · high | ⬜ |
| **GĐ C** | **Nối và phát hành** | | | |
| 39 | Nối FE với BE thật, gỡ lớp giả lập | integration | Sonnet · high | ⬜ |
| 40 | E2E Playwright | test | Sonnet · medium | ⬜ |
| 41 | Deploy production | infra | Sonnet · high | ⬜ |

## ▶️ Đợt đang chờ: Đợt 8 — Tài khoản BE: Admin gốc, duyệt, consent
Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`. Prompt nằm ở mục **➡️ Đợt tiếp** cuối Đợt 7 (bên dưới).

---

# ĐÃ XONG — NỀN TẢNG (kế hoạch cũ, giữ để tra cứu)

### Đợt 0 — Nền tảng Backend ✅ 2026-09-25
IDEA §11 · DECISIONS #1–14, #39–44
- [x] `apps/backend`: dự án Maven, dùng Maven Wrapper, Java 21, Spring Boot 4.1.x (cố định bản patch). Các dependency: web, security, oauth2-resource-server, data-jpa, validation, flyway + flyway-mysql, mysql-connector-j, actuator, spring-modulith, mapstruct, springdoc 3.x, caffeine, bucket4j, testcontainers-mysql. ✅ 2026-09-25
- [x] Package `vn.giapha`, tạo 13 module rỗng (`auth family member tree calendar event proposal notification file ai report admin common`), mỗi module có `package-info.java`. ✅ 2026-09-25
- [x] `application.yml`, `application-dev.yml`, `application-prod.yml`, mọi bí mật đọc từ biến môi trường. JVM chạy UTC. Tạo `apps/backend/.env.example` liệt kê đủ các khóa (IDEA §11). ✅ 2026-09-25
- [x] `infra/docker-compose.dev.yml`: MySQL 8.4, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`, có volume. ✅ 2026-09-25
- [x] `V1__audit_log.sql` + module `common`: `AuditLogWriter`, `BusinessException`, `GlobalExceptionHandler` trả `ProblemDetail` kèm `errors[]`. ✅ 2026-09-25
- [x] `SecurityConfig` tạm: stateless, mở `/actuator/health`, `/v3/api-docs/**`, `/swagger-ui/**`, mọi đường dẫn khác bắt buộc đăng nhập. ✅ 2026-09-25
- [x] Test: `ModularityTests` (verify), `ApplicationSmokeTest` (Testcontainers, Flyway chạy được), test `GlobalExceptionHandler`. ✅ 2026-09-25
- [x] `.github/workflows/ci.yml` có job `backend` (JDK 21, `./mvnw verify`). `.gitignore` gốc (`.env`, `target`, `node_modules`, `dist`). ✅ 2026-09-25
- [x] Bố cục package theo `docs/STRUCTURE.md` §3 (thêm `config/`, `common/{audit,security,exception,consent,web,util}`). ✅ 2026-09-25
- [x] `.claude/` theo `docs/STRUCTURE.md` §2: `settings.json` (hook chặn ghi `.env*` và file Flyway V đã có, nhắc đọc ROADMAP), 4 skill (`dot-close`, `be-slice`, `fe-feature`, `flyway-migration`), 3 agent (`code-reviewer`, `test-writer`, `security-reviewer`), và `.mcp.json` (playwright, mysql-dev chỉ đọc). Ghi `.claude/settings.local.json` vào `.gitignore`. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Dựng khung backend Spring Boot 4.1.1 (Java 21, Maven Wrapper, Modulith 2.1.1, Flyway, springdoc 3.1.1), 13 module rỗng, `common` (audit, exception), `SecurityConfig` tạm (stateless, JWT HS256), MySQL 8.4 dev bằng Docker, CI backend, cấu hình `.claude/` và `.mcp.json`. `.\mvnw.cmd verify` pass: 19 test (Modularity 2, Smoke 6, AuditLogWriter 3, GlobalExceptionHandler 8), Testcontainers MySQL 8.4 chạy trên Docker Desktop. Đã chạy thử app profile dev: health UP, swagger-ui 200, `/api/abc` 401.
- File chính: `apps/backend/pom.xml`, `application*.yml`, `.env.example`, `db/migration/V1__audit_log.sql`, `common/audit/*`, `common/exception/*`, `config/SecurityConfig.java`, `infra/docker-compose.dev.yml`, `.github/workflows/ci.yml`, `.claude/{settings.json,hooks/,agents/}`, `.mcp.json`.
- Khác dự kiến: (1) bảng `audit_log` đặt tên cột `before_data`/`after_data`/`created_at` vì `before` là từ khóa MySQL (IDEA ghi `before`/`after`/`at`); (2) `common` và `config` là module OPEN của Modulith để các module gọi trực tiếp `AuditLogWriter`, `BusinessException`; (3) `AuditLogWriter` bắt buộc chạy trong transaction có sẵn (MANDATORY) và repository chỉ có `save` để audit log không bị sửa/xóa; (4) hook của `.claude/settings.json` gọi script trong `.claude/hooks/*.mjs` (cần Node); (5) cổng MySQL dev trên host là **3307** vì máy đã có MySQL chiếm 3306.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): 401/403 do filter chain của Spring Security hiện trả body rỗng, chưa phải ProblemDetail (làm ở Đợt 2 cùng JWT, để FE `ApiError` đọc được); `mysql-dev` trong `.mcp.json` chỉ đọc nhờ cờ `ALLOW_*_OPERATION=false` của gói MCP, chưa ép ở tầng DB (nên tạo user MySQL chỉ có SELECT); `.mcp.json` chưa chạy thử với Claude Code thật; job `frontend` của CI thêm ở Đợt 1.

**🔧 Setup thủ công cần làm:**
- Cài JDK 21 và Docker Desktop (bật WSL2).
- Copy `apps/backend/.env.example` thành `apps/backend/.env`, điền `JWT_SECRET` (≥ 32 byte ngẫu nhiên, ví dụ `openssl rand -base64 48`). `DB_PASSWORD` mặc định `giapha_dev` khớp với docker-compose; nếu đổi thì luôn khởi động DB bằng `--env-file` (xem bước 1) và xóa volume cũ (`docker compose ... down -v`) vì MySQL chỉ đặt mật khẩu ở lần khởi tạo đầu.

**🧪 Test thủ công (từng bước):**
1. `docker compose --env-file apps/backend/.env -f infra/docker-compose.dev.yml up -d` (chạy ở gốc repo), rồi kiểm tra `docker ps` thấy `giapha-mysql-dev` ở trạng thái `healthy`. Cổng host là 3307.
2. Trong `apps/backend`, chạy `.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev`.
3. Mở `http://localhost:8080/actuator/health`, kết quả phải có `"status":"UP"` (kèm `groups`).
4. Mở `http://localhost:8080/swagger-ui.html`, trang phải hiện ra.
5. Mở `http://localhost:8080/api/abc`, kết quả phải là 401.
6. Chạy `.\mvnw.cmd verify`, toàn bộ phải xanh.

**➡️ Đợt tiếp:** Đợt 1 — Nền tảng Frontend · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 1 — Nền tảng Frontend theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 1 trong ROADMAP.md, docs/DECISIONS.md (#4, #14, #36–38), .claude/rules/frontend.md. Dựng Vite + React 19 + TS + Tailwind 4 + shadcn/ui, token theo DESIGN.md, AppShell (sidebar/rail/bottom nav), api client, gen:api, Vitest, CI frontend. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 1. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 1 — Nền tảng Frontend ✅ 2026-09-25
DECISIONS #4, #14, #36–38 · DESIGN toàn bộ
- [x] `apps/frontend`: Vite + React 19 + TypeScript strict, ESLint (flat config) + Prettier, alias `@/`. ✅ 2026-09-25
- [x] Tailwind 4 + shadcn/ui. Đưa token từ `docs/DESIGN.md` vào `src/index.css` (`@theme` + các biến của shadcn), font Be Vietnam Pro, icon lucide. ✅ 2026-09-25
- [x] Bố cục thư mục theo `docs/STRUCTURE.md` §4 (`assets, components/{ui,shared}, layout, pages, features, hooks, context, services, utils, types`, không có `redux`). ✅ 2026-09-25
- [x] React Router 7 + `layout/AppShell`: Sidebar (≥1024px), rail 72px (768–1023px), BottomNav 5 mục (<768px), Header. Có trang tạm cho: Tổng quan, Cây, Thành viên, Lịch, Thêm, và trang 404. ✅ 2026-09-25
- [x] `src/services/client.ts` (wrapper của fetch, base `/api`, parse `ProblemDetail` thành `ApiError`), `QueryClientProvider`, Vite proxy `/api` sang `:8080`. ✅ 2026-09-25
- [x] Script `gen:api` (openapi-typescript) và chạy một lần để sinh `src/services/schema.d.ts`. ✅ 2026-09-25
- [x] Vitest + Testing Library, kèm một test cho BottomNav/AppShell. ✅ 2026-09-25
- [x] `ci.yml` có thêm job `frontend`: `npm ci`, `lint`, `build`, `test`. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Dựng `apps/frontend`: Vite 8 + React 19 + TypeScript strict, ESLint flat config + Prettier, alias `@/`, Tailwind 4 với token của DESIGN.md (`@theme` + biến shadcn), font Be Vietnam Pro tự host, lucide. `AppShell` gồm Sidebar 240px (≥1024px), rail 72px (768–1023px), BottomNav 5 mục (<768px, chừa safe-area) và Header; 5 trang tạm cùng trang 404 trong khung; `services/client.ts` (fetch wrapper, `ApiError` từ ProblemDetail), `QueryClientProvider`, proxy `/api` sang :8080, `gen:api`. `npm run lint`, `npm run build` pass; `npm test` pass 11 test (AppShell/BottomNav 6, client 5). Đã chạy app ở 1280px, 900px và 375px: không cuộn ngang, sidebar 240px / rail 72px / bottom bar 5 mục, focus ring 2px accent, `gen:api` sinh được file (chạy với backend Đợt 0, proxy `/api/abc` trả 401).
- File chính: `apps/frontend/{package.json,vite.config.ts,eslint.config.js,components.json}`, `src/index.css`, `src/layout/*`, `src/pages/routes.tsx`, `src/services/{client,queryClient}.ts`, `src/components/{ui/button,shared/EmptyState}.tsx`, `.github/workflows/ci.yml` (job `frontend`).
- Khác dự kiến: (1) token đặt ở `src/index.css` (theo DESIGN/STRUCTURE) thay vì `src/styles/index.css` của ROADMAP; (2) nhãn BottomNav là **12px** theo DESIGN §6 (đã hỏi và chốt), không phải 16px như bước test 4 cũ; các chữ khác đều ≥16px; (3) TypeScript ghim **5.9.3** vì `openapi-typescript` 7.x chỉ chấp nhận peer TS 5.x (Vite template mặc định là TS 6); (4) font tự host bằng `@fontsource/be-vietnam-pro` (subset latin + vietnamese) thay vì `@import` Google Fonts của DESIGN §8.1, để PWA chạy offline (Đợt 21); (5) chỉ có Button + EmptyState trong `components/ui|shared`, tự viết theo DESIGN §6 và có `components.json` để `npx shadcn add` các thành phần khác khi cần (component shadcn dùng `bg-accent` phải đổi sang `bg-secondary` vì `--color-accent` của DESIGN là xanh nhấn); (6) ô tìm kiếm, chuông, avatar ở Header chỉ là khung giữ chỗ (vô hiệu hóa), làm ở Đợt 3, 11 và GĐ2; (7) các phiên bản patch đã ghim (không có ^ hay ~).
- Việc nên làm thêm (chưa làm, ngoài phạm vi): `schema.d.ts` hiện rỗng vì backend chưa có endpoint, chạy lại `npm run gen:api` sau mỗi đợt BE; đã chạy lại với backend thật trên MySQL cài sẵn (cổng 3306), database `family_management` (Flyway áp dụng V1, `/actuator/health` UP); nên thêm `.env.example` cho frontend ở Đợt 3 cùng `VITE_GOOGLE_CLIENT_ID`.

**🔧 Setup thủ công cần làm:**
- Cài Node 24 LTS (đã kiểm tra với v24.11.1).
- `npm install` trong `apps/frontend`. Muốn chạy `gen:api` thì phải bật backend (Đợt 0) ở cổng 8080.
- Backend đọc `apps/backend/.env`: `DB_NAME=family_management` (tên có dấu gạch dưới, database phải được tạo trước, `CREATE DATABASE family_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`), `JWT_SECRET` dài ≥ 32 byte (nếu ngắn hơn backend không khởi động được). Nếu dùng Docker MySQL thay vì MySQL cài sẵn: `docker compose --env-file apps/backend/.env -f infra/docker-compose.dev.yml up -d`.

**🧪 Test thủ công (từng bước):**
1. Chạy backend (Đợt 0). Trong `apps/frontend`, chạy `npm install` rồi `npm run dev`.
2. Mở `http://localhost:5173` ở khổ 1280px: phải thấy sidebar trắng và mục đang chọn có nền navy.
3. Thu về 900px: sidebar phải chỉ còn icon.
4. Thu về 375px: phải hiện thanh điều hướng dưới với 5 mục (nhãn 12px theo DESIGN), nội dung chính và các chữ khác không nhỏ hơn 16px, không cuộn ngang.
5. Bấm từng mục: URL đổi và trang tạm hiện ra. Vào `/abc` phải thấy trang 404 kèm nút "Về Tổng quan". Bấm Tab: focus ring xanh 2px nhìn rõ.
6. Chạy `npm run gen:api`: file `src/services/schema.d.ts` phải được tạo.

**➡️ Đợt tiếp:** Đợt 2 — Auth BE · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 2 — Auth BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 2 trong ROADMAP.md, roadmap/IDEA.md §6.1, docs/DECISIONS.md (#15–21), .claude/rules/backend.md và .claude/rules/security.md. Làm đăng ký + OTP, đăng nhập, JWT + refresh cookie xoay vòng, Google ID token, quên mật khẩu, khóa 15 phút, MailSender (Console cho dev). Chỉ làm checklist Đợt 2. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 2 — Auth BE ✅ 2026-09-25
IDEA §6.1 · DECISIONS #15–21
- [x] `V2__auth.sql`: `user_account`, `email_otp`, `refresh_token` (theo IDEA §4). ✅ 2026-09-25
- [x] `MailSender` + `ConsoleMailSender` (profile dev) + `SmtpMailSender` (dùng `MAIL_*`). ✅ 2026-09-25
- [x] Đăng ký tạo tài khoản PENDING và gửi OTP (hiệu lực 10 phút, sai tối đa 5 lần, 60 giây mới được gửi lại). Xác thực OTP thì chuyển ACTIVE và đăng nhập luôn. ✅ 2026-09-25
- [x] Đăng nhập bằng email/mật khẩu, lỗi chỉ báo chung. Sai 5 lần thì khóa 15 phút theo email (Caffeine + bucket4j). Rate limit cho gửi OTP. ✅ 2026-09-25
- [x] Phát JWT HS256 hiệu lực 15 phút (claim: `sub`, `sysRole`, `familyId`, `familyRole`, `memberId`). Refresh token 30 ngày trong cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, xoay vòng sau mỗi lần refresh, DB chỉ lưu SHA-256. Có `logout`. ✅ 2026-09-25
- [x] `POST /api/auth/google`: xác minh ID token (aud, iss, exp), tự liên kết theo email (#16). ✅ 2026-09-25
- [x] Quên mật khẩu: OTP RESET, đặt mật khẩu mới, thu hồi mọi refresh token. ✅ 2026-09-25
- [x] `GET /api/me` và helper `CurrentUser`. Job hằng ngày xóa tài khoản PENDING quá 7 ngày. ✅ 2026-09-25
- [x] Test: đăng ký rồi xác thực, OTP sai 5 lần, khóa đăng nhập, xoay vòng và thu hồi refresh token, đặt lại mật khẩu, response không chứa `passwordHash`, Google (mock bộ xác minh token). ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Module `auth` hoàn chỉnh: đăng ký + OTP (10 phút, 5 lần thử, 60 giây gửi lại, DB chỉ lưu HMAC của OTP), đăng nhập với lỗi chung và khóa 15 phút theo email, access JWT HS256 15 phút, refresh token 30 ngày trong cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` xoay vòng và chỉ lưu SHA-256, `logout`, Google ID token (xác minh chữ ký/aud/iss/exp, tự liên kết theo email), quên mật khẩu (kèm `verify-reset-otp`), `GET /api/me`, `CurrentUser`, job xóa PENDING quá 7 ngày, `MailSender` (Console cho dev, SMTP cho prod). 401/403 của filter chain nay trả `ProblemDetail`. `.\mvnw.cmd verify` pass: 65 test (AuthApiTest 33, Google verifier 7, LoginAttempt 3, RateLimiter 3, Modularity 2...). Đã chạy thật profile dev trên MySQL cài sẵn: đăng ký, OTP hiện trong log console, verify-otp trả 200 kèm `Set-Cookie`. Đã chạy lại `npm run gen:api` (schema.d.ts có các endpoint `/api/auth/*`, `/api/me`).
- File chính: `db/migration/V2__auth.sql`, `auth/{controller,service,repository,entity,dto,mapper,mail,google}/*`, `common/security/{CurrentUser,JwtService,RateLimiter,ProblemDetailSecurityHandlers}.java`, `config/{AppProperties,SecurityConfig,WebConfig,SchedulingConfig}.java`, test `auth/AuthApiTest.java`.
- Khác dự kiến: (1) `security-review` tìm ra lỗi **High** và đã sửa: collation `utf8mb4_0900_ai_ci` bỏ dấu nên `alice@gmaíl.com` khớp `alice@gmail.com` trong khi OTP gửi tới địa chỉ do người gọi nhập, có thể chiếm tài khoản qua quên mật khẩu. Cột `email` (user_account, email_otp) nay là `ascii_bin`, mọi DTO chỉ nhận email ASCII, Google từ chối email có dấu; (2) thêm `verify-reset-otp` (kiểm OTP chưa tiêu) và `resend-otp` vì luồng FE cần; (3) Google đăng nhập với email chưa có tài khoản thì tạo mới ACTIVE; khi liên kết vào tài khoản PENDING thì xóa mật khẩu (chống chiếm trước); (4) refresh token dùng lại chỉ bị từ chối, không thu hồi cả họ token (tránh đăng xuất oan khi FE gọi refresh song song); (5) thêm `spring-boot-starter-mail`; (6) job dọn dẹp còn xóa OTP và refresh token hết hạn; (7) `origin/HEAD` cục bộ được trỏ tới `dien2701/main` để chạy được skill security-review.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): đăng ký lại email PENDING ghi đè mật khẩu và thay OTP (nguy cơ pre-hijack, cần đúng thời điểm, cân nhắc cho verify-otp gửi lại mật khẩu); `forgot-password` chỉ gửi mail khi email tồn tại nên có kênh đo thời gian (gửi mail bất đồng bộ); refresh 401 chưa xóa cookie; gộp ràng buộc email thành một annotation `@AsciiEmail`; chưa có cách tạo System Admin đầu tiên (Đợt 32); FE (Đợt 3): `/api/auth/login` trả 401 khi sai mật khẩu nên `client.ts` không được tự refresh rồi thử lại với `/api/auth/*`.

**🔧 Setup thủ công cần làm:**
- Google Cloud Console: tạo OAuth Client ID loại *Web*, thêm origin `http://localhost:5173`, rồi điền `GOOGLE_CLIENT_ID` vào `apps/backend/.env`.
- `JWT_SECRET` dài ≥ 32 byte. Prod cần thêm `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`.
- Cookie refresh luôn `Secure`: Chrome/Firefox vẫn nhận trên `http://localhost`, Safari thì không.

**🧪 Test thủ công (từng bước):**
1. Chạy backend ở profile dev, mở Swagger.
2. `POST /api/auth/register` với email mới (chỉ ký tự ASCII), lấy OTP 6 số trong log console.
3. `POST /api/auth/verify-otp`: nhận `accessToken`, và tab Network phải có header `Set-Cookie` HttpOnly.
4. `GET /api/me` kèm Bearer token: phải thấy thông tin user và không có trường hash nào.
5. Đăng nhập sai mật khẩu 5 lần: lần thứ 6 báo bị khóa, dù có nhập đúng mật khẩu.
6. `POST /api/auth/refresh`: nhận token mới, dùng lại cookie cũ phải bị từ chối.
7. Quên mật khẩu, nhập OTP trong log (có thể kiểm bằng `verify-reset-otp`), đặt mật khẩu mới. Refresh token cũ phải không còn dùng được.

**➡️ Đợt tiếp:** Đợt 3 — Auth FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `security-review`, `code-review`
```text
Làm Đợt 3 — Auth FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 3, roadmap/IDEA.md §6.1, docs/DECISIONS.md (#15–17), .claude/rules/frontend.md và .claude/rules/security.md. Làm các trang đăng nhập/đăng ký/OTP/quên mật khẩu, nút Google, AuthProvider giữ token trong bộ nhớ, tự refresh khi gặp 401, route guard. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 3. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 3 — Auth FE ✅ 2026-09-25
IDEA §6.1 · DECISIONS #15–17
- [x] Các trang: Đăng nhập, Đăng ký (có tick đồng ý điều khoản), Nhập OTP (đếm ngược 60 giây mới gửi lại được), Quên mật khẩu, rồi OTP, rồi Mật khẩu mới. ✅ 2026-09-25
- [x] Nút "Đăng nhập với Google" dùng Google Identity Services, gọi `/api/auth/google`. ✅ 2026-09-25
- [x] `AuthProvider`: access token chỉ giữ trong bộ nhớ. Khi tải trang thì gọi `/auth/refresh`. `client.ts` gắn Bearer, gặp 401 thì refresh một lần rồi thử lại. Có đăng xuất. ✅ 2026-09-25
- [x] Route guard và điều hướng sau đăng nhập: chưa có family vào `/bat-dau` (trang tạm), có family vào `/`, Admin vào `/quan-tri` (trang tạm). ✅ 2026-09-25
- [x] Lỗi trong `ProblemDetail.errors` hiện đúng dưới từng trường (RHF + Zod). ✅ 2026-09-25
- [x] Test Vitest cho schema Zod của form đăng ký. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Dựng module `features/auth` ở frontend: trang Đăng nhập, Đăng ký (có tick điều khoản), Xác thực OTP (đếm ngược 60 giây, mốc gửi lại giữ được khi F5) và Quên mật khẩu (email → OTP → mật khẩu mới, một route `/quen-mat-khau`), nút Google Identity Services. `AuthProvider` giữ access token chỉ trong bộ nhớ (biến của `services/client.ts`), tải trang thì gọi `/auth/refresh`; `client.ts` gắn Bearer, gặp 401 thì refresh một lần (gộp các lời gọi song song vào một request, vì refresh token xoay vòng) rồi thử lại. Route guard chia ba khu: family (`/`), chưa có family (`/bat-dau`), Admin (`/quan-tri`); trang `/bat-dau` và `/quan-tri` là trang tạm. Lỗi `ProblemDetail.errors` hiện dưới từng trường (RHF + Zod). Header hiện chữ cái đầu của người dùng, trang Thêm có thẻ tài khoản + Đăng xuất. `npm run lint`, `npm run build` pass; `npm test` pass 40 test (schema đăng ký 8, guards 8, routing 3, client phiên 7...). Đã chạy thật với backend dev trên MySQL cài sẵn (chủ yếu ở 375px, giao diện đăng ký và `/bat-dau` xem thêm ở 1280px; nút Google đã hiện nhưng **chưa bấm thử đăng nhập Google thật** vì cần tài khoản Google; thay đổi `logout()` sau code-review chỉ có test tự động, chưa chạy lại trên trình duyệt): đăng ký, OTP sai (báo "Còn 4 lần thử") rồi OTP đúng vào `/bat-dau`, F5 vẫn còn phiên, Local/Session Storage rỗng, đăng xuất, đăng nhập sai chỉ báo lỗi chung, quên mật khẩu trọn luồng rồi đăng nhập bằng mật khẩu mới. `security-review` không thấy lỗ hổng độ tin cậy cao; `code-review` ra 8 phát hiện, đã sửa 6.
- File chính: `apps/frontend/src/{services/client.ts,context/{authContext.ts,AuthProvider.tsx},hooks/{useAuth,useCountdown}.ts,features/auth/**,components/{ui/{input,checkbox}.tsx,shared/{FormField,PasswordInput,OtpInput,Alert,FullPageSpinner}.tsx},layout/PlainLayout.tsx,pages/{routes,OnboardingPage,AdminHomePage,MorePage}.tsx,utils/{formErrors,time}.ts,types/{api,google.d}.ts}`, `apps/frontend/.env.example`.
- Khác dự kiến: (1) Quên mật khẩu là một route với 3 bước trong bộ nhớ, không phải 3 URL riêng, để OTP không nằm trên URL hay trong history state (F5 thì làm lại từ đầu); (2) email của luồng OTP đăng ký đi theo `history.state`, không đưa lên URL; (3) checkbox đồng ý điều khoản chưa có link tới trang Chính sách bảo mật vì trang đó làm ở Đợt 5 (cần thêm link khi làm Đợt 5); (4) nút Google là nút do chính Google vẽ (cao 40px, theo quy định của GIS), chỉ hiện khi có `VITE_GOOGLE_CLIENT_ID`; (5) sau khi đăng xuất chủ động thì không nhớ trang để quay lại, còn hết phiên hoặc mở link sâu thì có (`state.from`, chỉ nhận đường dẫn nội bộ); (6) `logout()` ném lỗi nếu server không nhận được lời gọi (giữ nguyên phiên và báo người dùng) để cookie refresh không còn hiệu lực ngầm; (7) `refresh()` trong context trả `boolean`, dùng cho Đợt 5; (8) chữ hint dưới trường và chữ "hoặc" cỡ 14px theo DESIGN §2 (chú thích), còn lại ≥ 16px.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): chưa có test riêng cho `AuthProvider`, `OtpForm`, `applyApiError`; chưa kiểm được trực quan khung chính (`AppShell`, thẻ tài khoản trong trang Thêm, avatar chữ cái) với người dùng có family vì chưa có endpoint tạo family (Đợt 4), hiện chỉ có test tự động; sau Đợt 5 nên kiểm lại ở 375px và 1280px; `client.ts` loại trừ refresh theo tiền tố `/auth/` (có test) — nếu sau này có endpoint công khai ngoài `/auth/` thì đổi sang tùy chọn tường minh; nhiều tab mở cùng lúc khi tải trang có thể refresh song song và một tab bị đăng xuất (hiếm); tài khoản thử `thu.dot3a@example.com` (mật khẩu `matkhaumoi123`) còn trong DB dev, có thể xóa.

**🔧 Setup thủ công cần làm:**
- Tạo `apps/frontend/.env.local` với `VITE_GOOGLE_CLIENT_ID=<cùng client id ở Đợt 2>` (mẫu ở `apps/frontend/.env.example`; để trống thì nút Google bị ẩn). Trong Google Cloud Console phải có origin `http://localhost:5173` (đã nêu ở Đợt 2). Vite phải khởi động lại nếu thêm biến sau khi đã chạy.
- Chạy backend (profile dev) song song với `npm run dev`; vì cookie refresh có `Path=/api/auth` nên frontend phải gọi qua proxy `/api` cùng origin (đã cấu hình sẵn).

**🧪 Test thủ công (từng bước):**
1. Mở `/dang-ky` ở khổ 375px, bỏ trống mọi trường rồi bấm Đăng ký: lỗi phải hiện dưới từng trường.
2. Đăng ký bằng email mới, lấy OTP trong log backend, nhập vào: phải chuyển tới `/bat-dau`.
3. F5: vẫn còn đăng nhập. Kiểm tra DevTools > Application > Local Storage: không có token.
4. Đăng xuất rồi đăng nhập lại bằng mật khẩu sai: chỉ hiện lỗi chung.
5. Đăng nhập bằng Google: phải vào được app.
6. Làm luồng Quên mật khẩu từ đầu đến cuối.

**➡️ Đợt tiếp:** Đợt 4 — Dòng họ BE · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 4 — Dòng họ BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 4, roadmap/IDEA.md §3 và §6.2, docs/DECISIONS.md (#22–24), .claude/rules/backend.md. Làm tạo family kèm consent NĐ 13, mã mời (dùng nhiều lần, thu hồi được, hết hạn 7 ngày), tham gia, rời, loại thành viên, chuyển quyền Manager. Chỉ làm checklist Đợt 4. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 4 — Dòng họ BE ✅ 2026-09-25
IDEA §3, §6.2 · DECISIONS #22–24
- [x] `V3__family.sql`: `family`, `family_invitation` (thêm `revoked_at`), `user_consent`. Phiên bản chính sách lấy từ cấu hình `app.policy.version`. ✅ 2026-09-25
- [x] Tạo family (chỉ cho user chưa có family), người tạo thành Manager, lưu consent. ✅ 2026-09-25
- [x] Mã mời: tạo (chuỗi ngẫu nhiên 8 ký tự + link), xem danh sách, thu hồi. Tham gia bằng mã (lưu consent) thì vào thẳng family. Báo lỗi riêng khi mã hết hạn hoặc đã bị thu hồi. ✅ 2026-09-25
- [x] Rời family (User), loại thành viên (Manager), chuyển quyền Manager. Manager chỉ rời được sau khi đã chuyển quyền. Mỗi thay đổi đều thu hồi refresh token của người bị ảnh hưởng. ✅ 2026-09-25
- [x] `GET /api/family`: thông tin family và danh sách tài khoản. Email chỉ hiện cho Manager và chính chủ. ✅ 2026-09-25
- [x] Facade `FamilyFacade`, để module khác đọc `familyId` và vai trò. ✅ 2026-09-25
- [x] Test: mã hết hạn hoặc bị thu hồi, user đã có family không tham gia được family khác, chuyển quyền, truy cập chéo family trả 404. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Module `family` BE: tạo family (người tạo thành Manager, lưu `user_consent` kèm `app.policy.version` và IP), mã mời 8 ký tự (bỏ ký tự dễ nhầm, dùng nhiều lần, hết hạn 7 ngày, thu hồi được, lỗi riêng `INVITE_NOT_FOUND` 404 / `INVITE_REVOKED` 410 / `INVITE_EXPIRED` 410), tham gia bằng mã (vào thẳng family, lưu consent), rời, loại tài khoản, chuyển quyền Manager, `GET /api/family` và `GET /api/family/{id}` (email chỉ hiện cho Manager và chính chủ), `FamilyFacade`. `.\mvnw.cmd verify` pass: 82 test (thêm `FamilyApiTest` 20 test: mã hết hạn/thu hồi, đã có family không tham gia được, chuyển quyền, Manager không rời được, Admin bị chặn, tài khoản khóa, truy cập chéo family trả 404, audit log, facade). `code-review` ra 2 phát hiện, đã sửa cả hai.
- Endpoint: `POST /api/family`, `POST /api/family/join`, `GET /api/family[/{id}]`, `POST|GET /api/family/invitations`, `DELETE /api/family/invitations/{id}`, `POST /api/family/leave`, `DELETE /api/family/accounts/{userId}`, `POST /api/family/transfer-manager`.
- File chính: `db/migration/V3__family.sql`, `family/**` (entity, repository, service, dto, mapper, controller, `FamilyFacade`), `auth/AuthFacade.java`, `common/consent/*`, `config/AppProperties.java` (`app.policy.version`, `app.family.*`), `FamilyApiTest`.
- Khác dự kiến: (1) family không phụ thuộc entity của auth: gọi qua `AuthFacade` mới ở gốc module auth (vai trò trao đổi dạng chuỗi); (2) vai trò và family của người gọi **đọc từ DB, không tin claim** (claim có thể cũ 15 phút), thao tác đổi thành viên khóa dòng `family` (`PESSIMISTIC_WRITE`) trước rồi kiểm quyền; (3) gán family bằng UPDATE có điều kiện `family_id IS NULL` nên hai request song song chỉ một cái thắng; (4) Admin bị chặn tạo/tham gia family (403 `ADMIN_CANNOT_HAVE_FAMILY`) theo DECISIONS #22 dù IDEA §3 ghi Admin được tạo; (5) rời, loại và chuyển quyền thu hồi refresh token của người bị ảnh hưởng, gồm **cả Manager cũ và người nhận khi chuyển quyền** (theo security.md), còn tạo/tham gia thì không thu hồi để FE refresh lấy claim mới; (6) V3 thêm FK `user_account.family_id -> family(id)`, nên `AuthApiTest` phải tạo dòng family thật; `created_by` không có FK; (7) request tạo family chưa có `coverUrl` (làm cùng module file, Đợt 10); (8) `.env.example` có gợi ý `FRONTEND_BASE_URL` để dựng link mời `/moi/{code}`.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): **Đợt 5 FE**: sau khi rời, bị loại hoặc chuyển quyền thì refresh sẽ trả 401 nên FE phải đưa người dùng về đăng nhập, không gọi refresh như ghi trong checklist Đợt 5; Manager là thành viên duy nhất thì không có cách rời hay giải tán family (chờ Đợt 32 quản trị); `http.getRemoteAddr()` (dùng cho consent và rate limit) sẽ là IP của nginx khi deploy, cần cấu hình `forward-headers-strategy` ở Đợt 23; các module sau vẫn dùng claim token nên khi cần quyền chính xác hãy hỏi `FamilyFacade`.

**🔧 Setup thủ công cần làm:** Không có (tuỳ chọn: đặt `FRONTEND_BASE_URL` khi deploy để link mời trỏ đúng tên miền).

**🧪 Test thủ công (từng bước):**
1. User A tạo family qua Swagger, gọi `/api/me` thì phải thấy `familyRole=MANAGER`.
2. A tạo mã mời. User B tham gia bằng mã đó, gọi `/api/family` thì phải thấy 2 tài khoản.
3. A thu hồi mã. User C dùng lại mã đó phải bị báo lỗi.
4. A thử rời family: bị chặn. A chuyển quyền cho B rồi rời: thành công.
5. Dùng token của family khác gọi `/api/family/{id}`: nhận 404.
6. Sau bước 4 (chuyển quyền, rời), refresh của A và B bị từ chối (401): phải đăng nhập lại để có claim mới.

**➡️ Đợt tiếp:** Đợt 5 — Dòng họ FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 5 — Dòng họ FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 5, roadmap/IDEA.md §6.2, docs/DECISIONS.md (#22–24), .claude/rules/frontend.md. Làm màn hình onboarding "Tạo dòng họ / Nhập mã mời" có consent, trang Chính sách bảo mật, mở link mời, trang Dòng họ (mã mời, chia sẻ, chuyển quyền, loại, rời). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 5. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 5 — Dòng họ FE ✅ 2026-09-25
IDEA §6.2 · DECISIONS #22–24
- [x] `/bat-dau`: hai lựa chọn "Tạo dòng họ" (tên, quê quán, mô tả) và "Nhập mã mời". Cả hai đều bắt tick đồng ý, có link tới trang chính sách. ✅ 2026-09-25
- [x] `/chinh-sach-bao-mat`: trang tĩnh ghi đủ 5 ý ở IDEA §6.2, có hiện phiên bản chính sách. ✅ 2026-09-25
- [x] `/moi/:code`: nếu chưa đăng nhập thì chuyển qua đăng nhập/đăng ký rồi quay lại để tham gia. ✅ 2026-09-25
- [x] Trang "Dòng họ" (trong menu Thêm): thông tin, danh sách tài khoản. Manager có thêm: tạo mã, "Chia sẻ" (Web Share API, không hỗ trợ thì sao chép link), thu hồi, chuyển quyền, loại thành viên. Mọi người đều có nút "Rời dòng họ". ✅ 2026-09-25
- [x] Sau khi tham gia hoặc tạo family thì gọi refresh để cập nhật claim. Rời, chuyển quyền: backend thu hồi refresh token nên refresh trả 401, phiên kết thúc và người dùng về trang đăng nhập (theo ghi chú Đợt 4). ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Module `features/family` ở frontend: màn hình `/bat-dau` có hai tab "Nhập mã mời" và "Tạo dòng họ" (tên, quê quán, mô tả), cả hai bắt tick đồng ý kèm link mở tab mới tới trang Chính sách bảo mật; trang `/chinh-sach-bao-mat` công khai (5 ý theo IDEA §6.2, hiện phiên bản chính sách); `/moi/:code` (chưa đăng nhập thì sang đăng nhập/đăng ký rồi quay lại, mã điền sẵn); trang Dòng họ ở `/them/dong-ho` (menu Thêm): thông tin, danh sách tài khoản, Manager có tạo mã, Chia sẻ (Web Share, không có thì sao chép link), thu hồi, chuyển quyền, loại; mọi người có "Rời dòng họ" (Manager bị chặn kèm giải thích). Xác nhận thao tác bằng hộp thoại `<dialog>` gốc (bottom sheet ở điện thoại, modal ≥768px). `npm run lint`, `npm run build` pass; `npm test` pass 48 test (thêm schema tạo/tham gia family và `carryFrom`). Đã chạy thật với backend dev (MySQL 3306) ở 375px và 1280px: đăng ký user mới vào `/bat-dau`, tạo mà chưa tick bị chặn, tick rồi tạo vào Dashboard; tạo mã, Chia sẻ; mở link mời khi chưa đăng nhập, đăng ký user C rồi OTP thì tự vào family; C rời thì về đăng nhập; A chuyển quyền cho B thì cả hai phải đăng nhập lại, đăng nhập lại A thấy A là thành viên (mất mục mã mời), B là Quản lý; thu hồi mã; không cuộn ngang ở cả hai khổ. Chưa chạy `code-review` (không nằm trong yêu cầu đợt).
- File chính: `apps/frontend/src/features/family/{api,hooks,schemas,strings,policyContent}.ts`, `features/family/{components,pages}/**`, `components/shared/ConfirmDialog.tsx`, `components/ui/textarea.tsx`, `utils/date.ts`, `pages/{routes,MorePage}.tsx`, `features/auth/{routing.ts,pages/{Login,Register,VerifyOtp}Page.tsx}`, `services/schema.d.ts` (sinh lại bằng `npm run gen:api`).
- Khác dự kiến: (1) **phiên bản chính sách** đang là hằng `POLICY_VERSION = '1.0'` trong `features/family/strings.ts` vì backend chưa có API trả `app.policy.version`; đổi bên backend thì phải đổi cả ở đây (hoặc thêm endpoint ở một đợt BE); (2) sau khi rời, chuyển quyền thì người thực hiện bị đưa về đăng nhập (không gọi refresh để giữ phiên, vì backend thu hồi token), người nhận quyền cũng bị đăng xuất và thấy vai trò mới sau khi đăng nhập lại; (3) `from` (trang định vào) được mang theo qua Đăng nhập, Đăng ký, OTP để link mời không bị mất, nhờ `carryFrom` ở `features/auth/routing.ts`; (4) `/moi/:code` nằm sau `RequireAuth` nhưng ngoài `AreaGuard` vì user đã có family/Admin cũng mở được link và được báo lý do; (5) trang Dòng họ đặt ở `/them/dong-ho` để mục "Thêm" vẫn sáng; vai trò Manager lấy từ danh sách tài khoản của `GET /api/family` chứ không từ claim; (6) thêm link chính sách vào checkbox của trang Đăng ký (còn nợ từ Đợt 3); (7) trang Thêm thêm mục "Chính sách bảo mật"; (8) nội dung Chính sách bảo mật do tôi soạn theo 5 ý của IDEA §6.2 và là **bản nháp cần người có trách nhiệm pháp lý duyệt** trước khi dùng thật (đặc biệt phần thời hạn xử lý yêu cầu xóa dữ liệu và thông tin liên hệ).
- Việc nên làm thêm (chưa làm, ngoài phạm vi): thông báo "Bạn đã rời dòng họ / quyền đã chuyển, hãy đăng nhập lại" trên trang đăng nhập (hiện chỉ bị chuyển ngầm); Manager là thành viên duy nhất không có cách giải tán family (chờ Đợt 32); test Vitest cho `ConfirmDialog`, `InvitationsSection` và luồng `/moi/:code` (jsdom chưa hỗ trợ `<dialog>.showModal`, cần mock); hai tài khoản thử `dot5.a@example.com`, `dot5.b@example.com` (mật khẩu `matkhau12345`) và family "Dong ho Nguyen" còn trong DB dev, có thể xóa; chunk JS chính đã hơn 500 kB, nên tách route (lazy) khi thêm các trang lớn (cây, lịch).

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng ký user mới: phải vào `/bat-dau`. Tạo dòng họ mà không tick đồng ý: bị chặn. Tick rồi tạo: vào Dashboard.
2. Vào Thêm > Dòng họ, tạo mã, bấm Chia sẻ: trên máy tính link được sao chép (điện thoại thì mở hộp thoại chia sẻ).
3. Mở cửa sổ ẩn danh, dán link, đăng ký user B: sau OTP, B thấy trang lời mời (mã điền sẵn); tick đồng ý rồi Tham gia: B vào Dashboard.
4. Manager chuyển quyền cho B: A bị đưa về đăng nhập; đăng nhập lại thì trang Dòng họ của A không còn mục Mã mời và các nút Chuyển quyền/Loại, B thì có.
5. Thu hồi mã, rồi mở lại link bằng user mới: báo mã đã bị thu hồi.
6. Kiểm tra mọi màn hình ở khổ 375px và 1280px.

**➡️ Đợt tiếp:** Đợt 6 — Lịch âm BE · Model **Opus** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 6 — Lịch âm BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 6, roadmap/IDEA.md §7, docs/DECISIONS.md (#11, #30, #31, #35), .claude/rules/backend.md. Cài thuật toán Hồ Ngọc Đức (UTC+7) trong module calendar, thêm quy tắc ngày giỗ/sinh nhật/sự kiện âm, và bộ đối chiếu 1900–2100 ở shared/fixtures/lunar lấy từ nguồn độc lập (không sinh từ chính code đang test). Chỉ làm checklist Đợt 6. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 6 — Lịch âm BE ✅ 2026-09-25
IDEA §7 · DECISIONS #11, #30, #31, #35
- [x] `calendar`: lớp `LunarCalendar` theo thuật toán Hồ Ngọc Đức, TZ +7. Làm các phép đổi dương sang âm, âm sang dương (có cờ nhuận), số ngày của tháng âm (29/30), tháng nhuận của năm. ✅ 2026-09-25
- [x] `AnniversaryRules`: xác định ngày giỗ trong năm âm Y. Thứ tự ưu tiên: ngày ghi đè, rồi tháng nhuận cúng tháng thường, rồi ngày 30 cúng 29. Sinh nhật âm và sự kiện âm dùng cùng quy tắc. Sinh nhật dương 29/2 dời sang 28/2. ✅ 2026-09-25
- [x] `shared/fixtures/lunar/`: file JSON đối chiếu gồm mùng 1 Tết 1900–2100, các tháng nhuận, và các ngày mẫu. **Lấy từ nguồn độc lập** (bảng của Hồ Ngọc Đức hoặc lịch chính thức), ghi nguồn vào `README.md`. ✅ 2026-09-25
- [x] Facade `CalendarFacade` và API: `GET /api/calendar/convert` (hai chiều), `GET /api/calendar/lunar-month-info`. ✅ 2026-09-25
- [x] Test: toàn bộ fixture, Tết 1985 là **21/01/1985** (lịch Việt Nam, khác Trung Quốc), các năm nhuận 2020 (tháng 4), 2023 (tháng 2), 2025 (tháng 6), đủ các nhánh của `AnniversaryRules`. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Module `calendar`: `LunarCalendar` (thuật toán Hồ Ngọc Đức, dựng từng năm âm thành danh sách tháng, có cache), `AnniversaryRules`, `CalendarService`, `CalendarFacade` (đổi hai chiều, kiểm tra ngày âm, tháng nhuận, ngày cúng giỗ/sinh nhật/sự kiện âm, sinh nhật dương 29/2), API `GET /api/calendar/convert` (`solar=` hoặc `lunarYear/lunarMonth/lunarDay/leap`) và `GET /api/calendar/lunar-month-info` (cần đăng nhập, lỗi trả ProblemDetail `LUNAR_DATE_INVALID`/`CALENDAR_OUT_OF_RANGE`/`CALENDAR_QUERY_INVALID`). Fixture `shared/fixtures/lunar/` giải mã từ bảng tiền tính TK19–TK22 của Hồ Ngọc Đức (`amlich-hnd.js`, bản lưu trữ web.archive.org, có SHA-256) bằng `generate.mjs`, không chạy công thức thiên văn nên độc lập với code; kèm 21 mốc tra tay trong `samples.json` mà script kiểm tra khớp bảng. `.\mvnw.cmd clean verify` pass: 129 test (calendar 44: `LunarCalendarTest` 18 so **mọi ngày** 01/01/1900–31/12/2100 hai chiều và mọi tháng của 202 năm âm, `AnniversaryRulesTest` 13, `CalendarApiTest` 13), Modularity xanh. Đã gọi `code-review` (5 phát hiện: sửa 3, bỏ qua 2).
- File chính: `calendar/{CalendarFacade,LunarDate,LunarMonthDay}.java`, `calendar/service/{LunarCalendar,AnniversaryRules,CalendarService}.java`, `calendar/controller/CalendarController.java`, `calendar/dto/*`, `calendar/mapper/CalendarMapper.java`, test `calendar/{LunarCalendarTest,AnniversaryRulesTest,CalendarApiTest,LunarFixtures}.java`, `shared/fixtures/lunar/{lunar-years.json,samples.json,generate.mjs,README.md}`.
- Khác dự kiến (đã hỏi và chốt): (1) **Múi giờ UTC+8 cho năm âm trước 1968**, UTC+7 từ 1968 (không phải +7 toàn bộ). Bảng HND dùng quy tắc này, và dùng +7 cho mọi năm thì lệch 31 tháng (Tết 1903/1935/1965, nhuận 1917/1922/1938/1947). Tết 1968 là 29/01 nên tháng Chạp 1967 chỉ có 29 ngày. (2) **Bảng hiệu chỉnh 8 ngày sóc** (`NEW_MOON_FIXES`: 1906/4, 1914/10, Tết 1916, 1920/10, Tết 1925, 2054/4, 2072/11, 2077/10), ở những tháng này trăng mới sát nửa đêm và công thức rút gọn lệch bảng 1 ngày. Riêng 7/5/2054, công thức gốc còn trả "ngày 0". (3) Chỉ hỗ trợ năm dương 1900–2100 và năm âm 1899–2100 (đúng khoảng đã đối chiếu), ngoài khoảng thì trả 400. (4) Mốc Tết 2030 là **02/02/2030** theo lịch Việt Nam (03/02 là lịch Trung Quốc, đã kiểm bằng PyEphem). (5) Endpoint calendar không đọc dữ liệu family nên không có test truy cập chéo family, chỉ có test 401 khi thiếu token. (6) Ngày ghi đè cũng áp quy tắc ngày 30 thành 29 để ngày cúng luôn tồn tại.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): bản TS (Đợt 7) phải port y nguyên quy tắc múi giờ 1968 và bảng `NEW_MOON_FIXES`. Muốn hỗ trợ trước 1900 thì cần đối chiếu thêm, vì bảng TK19 lệch cả tháng nhuận ở 1800–1811 (miền Nam dùng lịch +8 tới 1975 cũng chưa xử lý). Chạy lại `npm run gen:api` để FE có kiểu `ConvertResponse`/`LunarMonthInfoResponse`. `code-review` bỏ qua 2 điểm: kiểm tra tháng/ngày lặp lại ở `CalendarService` và `AnniversaryRules` (giữ lại để lớp thuần tự bảo vệ), và response ghép tay thay vì MapStruct (response ghép từ giá trị tính ra, không map từ object nào).

**🔧 Setup thủ công cần làm:** Không có. (Muốn sinh lại fixture: Node 24, `node shared/fixtures/lunar/generate.mjs`, cần mạng để tải bản lưu trữ.)

**🧪 Test thủ công (từng bước):**
1. Chạy backend, đăng nhập lấy access token (`POST /api/auth/login`), bấm **Authorize** trong Swagger và dán token vào (API lịch cần đăng nhập, thiếu token sẽ trả 401).
2. `GET /api/calendar/convert?solar=2026-02-17`: `lunar` = năm 2026, tháng 1, ngày 1, `leap=false` (Tết Bính Ngọ).
3. `?solar=2025-01-29` và `?solar=1985-01-21`: đều là mùng 1/1 âm.
4. `?lunarYear=2025&lunarMonth=6&lunarDay=15&leap=true`: `solar` = `2025-08-08`. Đổi lại `?solar=2025-08-08`: ra 15/6 nhuận 2025 (`leap=true`).
5. `?lunarYear=2025&lunarMonth=5&lunarDay=1&leap=true`: trả 400, mã `LUNAR_DATE_INVALID`, thông báo "không có tháng 5 nhuận (năm này nhuận tháng 6)".
6. `GET /api/calendar/lunar-month-info?year=2025&month=6&leap=true`: `days=29`, `firstDay=2025-07-25`, `yearLeapMonth=6`.
7. Chạy `.\mvnw.cmd test -Dtest=*Lunar*`: toàn bộ xanh.

**➡️ Đợt tiếp:** Đợt 7 — Lịch âm FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 7 — Lịch âm FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 7, roadmap/IDEA.md §7, docs/DECISIONS.md (#35), .claude/rules/frontend.md. Port LunarCalendar và AnniversaryRules sang TS ở src/utils/lunar, chạy chung fixture shared/fixtures/lunar, làm component DualDateInput và trang "Đổi lịch âm–dương". Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 7. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 7 — Lịch âm FE ✅ 2026-09-25
IDEA §7 · DECISIONS #35
- [x] `src/utils/lunar/`: bản TS của `LunarCalendar` và `AnniversaryRules`, API giống bản Java. ✅ 2026-09-25
- [x] Vitest chạy **cùng** fixture `shared/fixtures/lunar/` với Java. ✅ 2026-09-25
- [x] Component `DualDateInput` (`components/ui`): chọn nhập theo Âm hoặc Dương, hiện ngày tương ứng ở lịch còn lại, có cờ nhuận, cho phép nhập "chỉ năm" hoặc "chỉ ngày/tháng âm". ✅ 2026-09-25
- [x] Trang "Đổi lịch âm–dương" trong menu Thêm, dùng `DualDateInput`. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. `src/utils/lunar/`: bản TS của backend, port từng dòng `LunarCalendar` (thuật toán Hồ Ngọc Đức, múi giờ UTC+8 trước 1968 và UTC+7 từ 1968, bảng `NEW_MOON_FIXES` 8 ngày sóc, cache theo năm âm) và `AnniversaryRules` (ghi đè, tháng nhuận cúng tháng thường, ngày 30 cúng 29, sinh nhật dương 29/2), cùng tên hàm và cùng quy tắc lỗi (`LunarError` thay `IllegalArgumentException`). Ngày dương là `{year, month, day}` thuần (không dùng `Date` cục bộ). `lunarCalendar.test.ts` đọc **cùng** `shared/fixtures/lunar/{lunar-years,samples}.json` qua alias `@fixtures` (không chép số liệu): so Tết và tháng nhuận 202 năm âm, ngày mùng 1 và độ dài mọi tháng, và đổi hai chiều **mọi ngày** 01/01/1900–31/12/2100 (73.414 ngày), toàn khớp ngay lần chạy đầu. Component `DualDateInput` (`components/ui`): nút chọn Dương/Âm, ba ô Ngày·Tháng·Năm (chỉ nhận số), ô tick "Tháng nhuận" kèm gợi ý năm nào nhuận tháng nào, vùng kết quả `aria-live` hiện ngày ở lịch còn lại (kèm thứ và tháng đủ/thiếu), cảnh báo tại chỗ khi ngày không tồn tại (tháng thiếu, cờ nhuận sai, 29/2 năm thường, năm ngoài 1900–2100). `allowYearOnly` cho nhập chỉ năm, `allowNoYear` cho nhập chỉ ngày/tháng âm (áp `AnniversaryRules`, hiện ngày rơi vào năm âm tham chiếu). Đổi lịch mà ngày đang hợp lệ thì tự chuyển số sang lịch kia. Logic giải mã nằm ở `utils/lunar/dualDate.ts` (hàm thuần `resolveDualDate`, `switchCalendar`) để form dùng lại. Trang `features/calendar/pages/LunarConverterPage` ở `/them/doi-lich`, thêm mục "Đổi lịch âm – dương" vào trang Thêm; mặc định điền hôm nay (giờ +7) và có nút "Hôm nay". `npm run lint`, `npm run build` (gồm `tsc -b`) và `npm test` đều pass: 105 test (mới: `lunarCalendar` 20, `anniversaryRules` 13, `dualDate` 16, `DualDateInput` 8). Đã chạy app ở 375px và 1280px (xem ghi chú dưới). Đã gọi `ui-ux-pro-max` và `run`.
- File chính: `utils/lunar/{types,solarDate,lunarCalendar,anniversaryRules,dualDate,format,fixtures,index}.ts` và test `{lunarCalendar,anniversaryRules,dualDate}.test.ts`, `components/ui/DualDateInput.tsx` (+ test), `features/calendar/{strings.ts,pages/LunarConverterPage.tsx}`, sửa `pages/routes.tsx`, `pages/MorePage.tsx`, `vite.config.ts` và `tsconfig.app.json` (alias `@fixtures` tới `shared/fixtures`).
- Khác dự kiến: (1) Trang đổi lịch tính hoàn toàn ở máy bằng bản TS, **không gọi** `/api/calendar/convert`, nên chưa cần chạy `npm run gen:api` (kiểu `ConvertResponse` để dành cho khi có màn hình cần gọi API). Test thủ công bước 2 "khớp với API" đã được bảo đảm bằng fixture chung và bằng việc bản Java đối chiếu cùng fixture. (2) Chưa có backend/DB trong lúc kiểm tra giao diện, nên dùng một máy chủ giả tạm (ngoài repo, chỉ trả phiên đăng nhập) để mở được trang sau đăng nhập; đã tắt sau khi xong. (3) Khung trình duyệt của app chỉ rộng khoảng 800px, nên khổ 1280px được kiểm bằng giả lập kích thước: đo bố cục (không cuộn ngang, sidebar 240px, thẻ 768px căn giữa) và xem ảnh chụp bị cắt, chưa xem trọn cả màn hình 1280px bằng mắt. (4) `fixtures.ts` chỉ dùng trong test; JSON fixture không lọt vào bản build. (5) Vite báo chunk >500 kB (554 kB), là cảnh báo có từ trước, không do đợt này.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): khi làm form thành viên (Đợt 10) và sự kiện thì tích hợp `DualDateInput` qua React Hook Form (dùng `resolveDualDate` để lấy giá trị đã kiểm tra và gán lỗi vào trường). Chưa có Playwright E2E cho trang này (E2E bắt đầu từ cuối GĐ1). Chưa hiển thị Can Chi của năm âm.

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Chạy `npm run dev` trong `apps/frontend`, đăng nhập bằng user thuộc một dòng họ, vào Thêm > Đổi lịch âm – dương (`/them/doi-lich`). Mở trang Đổi lịch, nhập dương 17/02/2026: phải hiện 1/1 âm.
2. Chuyển sang nhập âm 15/6 nhuận năm 2025: phải hiện đúng ngày dương, khớp với API `/api/calendar/convert`.
3. Nhập âm 30/12 của một năm có tháng 12 thiếu: phải hiện cảnh báo rằng ngày không tồn tại.
4. Ở khổ 375px, dùng bàn phím Tab qua các ô: focus ring phải nhìn thấy rõ.

**➡️ Đợt tiếp:** Đợt 8 — Tài khoản BE: Admin gốc, duyệt, consent · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 8 — Tài khoản BE: Admin gốc, duyệt, consent theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 8, roadmap/IDEA.md §3 và §5, docs/DECISIONS.md (#55–57, #74), .claude/rules/backend.md và .claude/rules/security.md. Thêm approval_status cho user_account, Admin gốc qua ROOT_ADMIN_EMAIL, chặn API nghiệp vụ với tài khoản chưa duyệt, consent không gắn dòng họ, API quản lý tài khoản cho Admin (duyệt, từ chối, khóa, cấp/gỡ Admin, chặn Admin cuối cùng). Chưa gỡ module family (để Đợt 26). Chỉ làm checklist Đợt 8. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# CHUẨN BỊ

### Đợt 8 — Tài khoản BE: Admin gốc, duyệt, consent ⬜
IDEA §3, §5 · DECISIONS #55–57, #74
- [ ] `V4__account_approval.sql`: thêm `approval_status` (NOT NULL, mặc định `WAITING`), `approved_by`, `approved_at` vào `user_account`. Cho phép `user_consent.family_id` NULL. Tài khoản đã có trong DB giữ `WAITING`.
- [ ] `ROOT_ADMIN_EMAIL` (`AppProperties`, `.env.example`): khi email này xác thực OTP, đăng nhập hoặc đăng nhập Google **mà hệ thống chưa có ADMIN nào** thì nâng thành `ADMIN` + `APPROVED`. Chống hai request song song cùng nâng (khóa hoặc UPDATE có điều kiện).
- [ ] JWT có thêm claim `approval`. Chặn mọi API nghiệp vụ với tài khoản chưa `APPROVED`, trả 403 ProblemDetail `ACCOUNT_NOT_APPROVED`. Ngoại lệ: `/api/auth/**`, `GET /api/me`, `POST /api/me/consent`. Thao tác ghi kiểm tra trạng thái từ DB, không chỉ tin claim.
- [ ] Consent: đăng ký bằng email lưu `user_consent` (family_id NULL, `app.policy.version`, IP). `GET /api/me` trả thêm `approvalStatus` và `consentRequired`. `POST /api/me/consent` lưu consent (dùng cho người đăng nhập Google lần đầu, hoặc khi đổi phiên bản chính sách).
- [ ] `/api/admin/accounts` (chỉ ADMIN):
  - `GET`: lọc theo trạng thái duyệt, trạng thái, vai trò; tìm theo tên hoặc email; phân trang.
  - `POST /{id}/approve`, `/reject`, `/lock`, `/unlock`, `/grant-admin`, `/revoke-admin`.
  - Admin không tự gỡ quyền và không tự khóa mình (`SELF_ACTION_FORBIDDEN`). Chặn gỡ quyền hoặc khóa Admin cuối cùng (`LAST_ADMIN`).
  - Từ chối, khóa và đổi vai trò đều thu hồi refresh token của người bị ảnh hưởng.
  - Ghi audit log (family_id NULL).
- [ ] Module `family` giữ nguyên, sẽ gỡ ở Đợt 26. Endpoint family cũng yêu cầu tài khoản đã duyệt.
- [ ] Test:
  - Admin gốc tự nâng quyền, nhưng chỉ khi chưa có Admin nào.
  - Tài khoản WAITING gọi API nghiệp vụ nhận 403, còn gọi `/api/me` thì được.
  - Consent của người dùng Google.
  - Duyệt, từ chối, khóa rồi mở khóa.
  - Chặn Admin cuối cùng và chặn tự thao tác.
  - User gọi `/api/admin/accounts` nhận 403.
  - Refresh token bị thu hồi sau khi từ chối, khóa hoặc đổi vai trò.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Điền `ROOT_ADMIN_EMAIL=<email của bạn>` vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Đăng ký bằng đúng `ROOT_ADMIN_EMAIL` và nhập OTP. Gọi `GET /api/me`: phải thấy `systemRole=ADMIN`, `approvalStatus=APPROVED`.
2. Đăng ký user B, nhập OTP. `GET /api/me` của B: `approvalStatus=WAITING`. B gọi `GET /api/calendar/convert?solar=2026-02-17`: nhận 403 `ACCOUNT_NOT_APPROVED`.
3. Admin gọi `GET /api/admin/accounts?approval=WAITING`: có B. Duyệt B. B refresh rồi gọi lại API lịch: nhận 200.
4. Admin cấp quyền Admin cho B, rồi thử tự gỡ quyền của chính mình: bị chặn. B gỡ quyền Admin của A: thành công. B thử tự gỡ quyền của mình khi chỉ còn B là Admin: bị chặn.
5. Khóa một User: refresh của người đó bị từ chối, đăng nhập lại cũng bị từ chối.

**➡️ Đợt tiếp:** Đợt 9 — Hợp đồng API, dữ liệu 28 người, lớp giả lập · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `code-review`
```text
Làm Đợt 9 — Hợp đồng API, dữ liệu 28 người, lớp giả lập theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 9, roadmap/IDEA.md §4, §11 và Phụ lục A, docs/DECISIONS.md (#68, #70–72), .claude/rules/frontend.md. Tạo shared/api/openapi.yaml (khởi tạo từ /v3/api-docs hiện tại, bỏ /api/family, thêm hợp đồng đọc thành viên), đổi gen:api sang đọc file này, tạo shared/fixtures/seed/members.json đúng 28 người của Phụ lục A (không thêm, không bớt, không bịa trường nào), dựng lớp giả lập src/services/mock (localStorage, chỉ endpoint có handler, còn lại gọi backend thật, không lọt vào build prod), handler GET /api/members và /api/members/{id}, nút Khôi phục và Tải dữ liệu tạm. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập (backend thật cho đăng nhập) và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 9. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN A — FRONTEND (CHẾ ĐỘ GIẢ LẬP)

> Mọi đợt GĐ A chạy frontend bằng `npm run dev:mock` (`VITE_API_MODE=mock`). Đăng nhập, `/api/me` và tài khoản vẫn gọi backend thật (Đợt 2–3, 8), nên backend dev phải đang chạy.
> Mỗi đợt làm theo thứ tự: (1) viết hợp đồng của module trong `shared/api/openapi.yaml` → (2) `npm run gen:api` → (3) handler giả lập → (4) UI → (5) test.
> Phần cần máy chủ (AI, push, upload, file Excel/PDF từ backend) hiện "Cần kết nối máy chủ" (#72).

### Đợt 9 — Hợp đồng API, dữ liệu 28 người, lớp giả lập ⬜
IDEA §4, §11, Phụ lục A · DECISIONS #68, #70–72
- [ ] `shared/api/openapi.yaml` (OpenAPI 3.1):
  - Khởi tạo từ `/v3/api-docs` hiện tại (auth, me, calendar, admin/accounts của Đợt 8). **Bỏ** `/api/family/**`.
  - Có schema `ProblemDetail` dùng chung, và `MemberSummary`, `MemberDetail`, `MemberPage`.
  - Thêm `GET /api/members` (tham số `q`, `sort`, `ageMin`, `ageMax`, `generation`, `deceased`, `onTree`, `page`, `size`) và `GET /api/members/{id}`.
  - Chạy `@redocly/cli lint` pass (script `npm run lint:api`).
- [ ] `gen:api` đọc `../../shared/api/openapi.yaml` (không cần backend chạy). Chạy lại để sinh `schema.d.ts`. Sửa những chỗ đang dùng kiểu family trong `schema.d.ts` (nếu build vỡ thì chỉ gỡ phần import, còn phần UI dòng họ để Đợt 10 gỡ).
- [ ] `shared/fixtures/seed/members.json`:
  - Đúng 28 người theo IDEA Phụ lục A, giữ họ tên nguyên văn.
  - Có `deathLunar{day,month,leap:false,year?}`, và `deathSolar` được tính bằng `utils/lunar` khi có năm.
  - Mọi người có `isDeceased: true` và cùng nơi an táng. Các trường khác để trống.
  - Kèm `README.md` ghi nguồn và quy ước.
  - Có Vitest kiểm tra: đủ 28 người, khớp Phụ lục A, và `deathSolar` khớp lịch âm.
- [ ] `src/services/mock/`:
  - `router` (method + mẫu path → handler).
  - `store` trong localStorage (key `giapha.mock.v1`), lần đầu khởi tạo từ `members.json`.
  - Helper tạo `ProblemDetail`, phân trang, tìm không dấu (dùng chung `utils/text`), và vai trò người dùng lấy từ `/api/me` thật.
  - Handler được phép **bọc** endpoint thật: gọi backend rồi bổ sung dữ liệu từ store.
- [ ] `client.ts`: ở chế độ giả lập, request có handler thì chạy handler (có trễ nhỏ để thấy trạng thái đang tải), không có handler thì gọi backend thật. Module mock được import động theo `import.meta.env.VITE_API_MODE`. Có test đảm bảo bản build prod không chứa mã mock.
- [ ] Handler `GET /api/members` và `GET /api/members/{id}`:
  - tìm không dấu, lọc, sắp xếp, phân trang;
  - `generation` và `onTree` lấy từ store cây (lúc này còn trống);
  - SĐT và email chỉ trả cho Admin và chính chủ.
- [ ] Trang Thêm có mục "Dữ liệu tạm" (chỉ hiện ở chế độ giả lập), gồm:
  - banner "Dữ liệu đang lưu tạm trên trình duyệt này";
  - nút **"Tải dữ liệu tạm (JSON)"** để giữ lại dữ liệu đã nhập cho Đợt 39;
  - nút **"Khôi phục dữ liệu gốc"** (có hộp xác nhận).
- [ ] `apps/frontend/.env.example` thêm `VITE_API_MODE`. Thêm script `dev:mock`.
- [ ] Test Vitest:
  - router;
  - tìm "nguyen van tham" ra "Cụ Nguyễn Văn Tham (Tức Cụ Kai)";
  - ẩn SĐT/email với User;
  - id không tồn tại trả ProblemDetail 404;
  - khôi phục dữ liệu gốc.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** `npm install` (có thêm `@redocly/cli`). Chạy backend dev như cũ.

**🧪 Test thủ công (từng bước):**
1. `npm run gen:api` khi **tắt** backend: vẫn sinh được `schema.d.ts`.
2. `npm run dev:mock`, đăng nhập bằng tài khoản đã duyệt. Trong DevTools Console gọi `GET /api/members?q=nguyen van` qua app (hoặc xem tab Network): có các "Nguyễn Văn…".
3. Thêm > Dữ liệu tạm: bấm "Khôi phục dữ liệu gốc": localStorage `giapha.mock.v1` được tạo lại với 28 người.
4. `npm run build`, rồi tìm chuỗi `giapha.mock` trong `dist`: không có.

**➡️ Đợt tiếp:** Đợt 10 — FE tài khoản: gỡ dòng họ, chờ duyệt, quản lý tài khoản · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `security-review`
```text
Làm Đợt 10 — FE tài khoản: gỡ dòng họ, chờ duyệt, quản lý tài khoản theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 10, roadmap/IDEA.md §3, §5 và §6.10, docs/DECISIONS.md (#54–57), .claude/rules/frontend.md và .claude/rules/security.md. Gỡ features/family và các trang /bat-dau, /moi/:code, /them/dong-ho; route guard theo approvalStatus; trang Chờ duyệt (consent cho Google, tự kiểm tra lại) và trang Không được duyệt; bỏ khu /quan-tri riêng, thêm menu Quản trị; trang Quản trị > Tài khoản dùng backend thật của Đợt 8. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập (backend thật cho đăng nhập và tài khoản) và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 10. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 10 — FE tài khoản: gỡ dòng họ, chờ duyệt, quản lý tài khoản ⬜
IDEA §3, §5, §6.10 · DECISIONS #54–57
- [ ] Gỡ `features/family`, các trang `/bat-dau`, `/moi/:code`, `/them/dong-ho` và mục "Dòng họ" trong trang Thêm. Gỡ các test liên quan. Không còn chỗ nào đọc `familyId` hoặc `familyRole`.
- [ ] Route guard mới theo `approvalStatus` của `/api/me`: WAITING vào `/cho-duyet`, REJECTED vào `/khong-duoc-duyet`, APPROVED vào app. Bỏ khu `/quan-tri` riêng: Admin dùng chung AppShell, và có thêm mục **"Quản trị"** (sidebar, rail, trang Thêm). Toàn bộ route `/quan-tri/**` có guard chỉ cho Admin.
- [ ] `/cho-duyet`:
  - giải thích ngắn;
  - nếu `consentRequired` thì bắt tick đồng ý (có link chính sách) và gọi `POST /api/me/consent`;
  - tự gọi `/api/me` mỗi 30 giây và khi cửa sổ được focus lại, được duyệt thì refresh rồi vào Tổng quan;
  - có nút Đăng xuất.
- [ ] `/khong-duoc-duyet`: thông báo và nút Đăng xuất.
- [ ] Quản trị > **Tài khoản** (backend thật):
  - tab "Chờ duyệt" (có badge số) và tab "Tất cả";
  - ô tìm, lọc trạng thái và vai trò;
  - hiện dạng thẻ trên điện thoại, dạng bảng trên máy tính.
  - Hành động: Duyệt, Từ chối, Khóa, Mở khóa, Cấp Admin, Gỡ Admin, đều qua `ConfirmDialog`.
  - Lỗi `LAST_ADMIN` và `SELF_ACTION_FORBIDDEN` hiện đúng thông báo. Không hiện nút tự gỡ quyền hoặc tự khóa trên dòng của chính mình.
- [ ] Trang Chính sách bảo mật: sửa nội dung, bỏ phần dòng họ, nêu rõ "một gia phả chung, Admin duyệt tài khoản".
- [ ] Test Vitest:
  - guard theo 3 trạng thái;
  - trang chờ duyệt tự chuyển khi được duyệt;
  - menu Quản trị ẩn với User;
  - URL `/quan-tri/tai-khoan` với User bị chặn.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng ký user mới, nhập OTP: phải vào `/cho-duyet`.
2. Mở cửa sổ khác bằng tài khoản Admin, vào Quản trị > Tài khoản > Chờ duyệt, bấm Duyệt. Trong vòng 30 giây, cửa sổ user tự vào Tổng quan.
3. Đăng nhập Google bằng tài khoản mới: trang chờ duyệt bắt tick đồng ý.
4. Từ chối một tài khoản: người đó thấy `/khong-duoc-duyet`.
5. User gõ thẳng `/quan-tri/tai-khoan`: bị chặn. Không còn đường nào dẫn tới trang Dòng họ.
6. Kiểm tra ở khổ 375px và 1280px.

**➡️ Đợt tiếp:** Đợt 11 — Thành viên FE: danh sách, chi tiết · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 11 — Thành viên FE: danh sách, chi tiết theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 11, roadmap/IDEA.md §6.1, docs/DECISIONS.md (#58, #66, #71), .claude/rules/frontend.md. Làm features/member (api, hooks, lọc trên URL), danh sách (bảng/thẻ, tìm không dấu, lọc, sắp xếp) và trang chi tiết (thẻ hồ sơ, liên hệ theo quyền, chỗ cho khối Người thân, Trên cây, Tệp) trên dữ liệu thật 28 người ở chế độ giả lập. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 11. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 11 — Thành viên FE: danh sách, chi tiết ⬜
IDEA §6.1 · DECISIONS #58, #66, #71
- [ ] `features/member`: `api.ts`, `hooks.ts` (TanStack Query, tham số lọc lưu trên URL), `strings.ts`.
- [ ] Danh sách:
  - dạng bảng trên máy tính, dạng thẻ trên điện thoại;
  - sắp xếp theo tên, tuổi, thời gian thêm, đời;
  - tìm không dấu;
  - lọc theo khoảng tuổi, đời, sống/mất, có trên cây;
  - có trạng thái rỗng (khác nhau cho "không có kết quả" và "chưa có ai"), skeleton khi tải, và trạng thái lỗi.
- [ ] Trang chi tiết:
  - Thẻ hồ sơ navy: avatar hoặc chữ cái đầu, họ tên nguyên văn, badge "Đã mất", ngày mất âm kèm dương (hoặc chỉ ngày/tháng âm), nơi an táng.
  - Các ô liên hệ chỉ hiện khi API có trả.
  - Người chưa có giới tính thì hiện trung tính, không đoán.
- [ ] Để chỗ sẵn các khối: Người thân (Đợt 13), Trên cây (Đợt 16), Tệp đính kèm (Đợt 22).
- [ ] Test: hook lọc đồng bộ với URL, thẻ hồ sơ khi thiếu dữ liệu (chỉ có tên), hiển thị ngày mất không có năm.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. `npm run dev:mock`, vào Thành viên: có 28 người, tất cả đều "Đã mất".
2. Gõ "kai": ra 3 người (Tham, Kai Nhất, Phí Thị Giản). Gõ "hang": ra "Nguyễn Thị Hằng".
3. Mở "Cụ Nguyễn Thị Thêm": ngày mất hiện "01/11 âm lịch", không có năm dương.
4. Mở "Nguyễn Văn Thành": ngày mất 02/05/2025 âm lịch kèm ngày dương tương ứng. Nơi an táng là Kim Hoàng.
5. F5 khi đang lọc: bộ lọc vẫn còn (nằm trên URL). Kiểm tra ở khổ 375px và 1280px.

**➡️ Đợt tiếp:** Đợt 12 — Thành viên FE: form, xóa, ảnh đại diện · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 12 — Thành viên FE: form, xóa, ảnh đại diện theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 12, roadmap/IDEA.md §6.1 và §6.7, docs/DECISIONS.md (#58, #62, #67, #72), .claude/rules/frontend.md. Viết hợp đồng tạo/sửa/xóa thành viên và sign/confirm ảnh, handler giả lập (xóa bị chặn khi có trên cây), MemberForm (chỉ họ tên bắt buộc, giới tính "Chưa rõ", DualDateInput cho ngày sinh/mất, cho phép chỉ ngày/tháng âm, khối "đã mất" tách riêng có lockDeathFields), nút Xóa, AvatarUpload (giả lập báo cần máy chủ). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 12. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 12 — Thành viên FE: form, xóa, ảnh đại diện ⬜
IDEA §6.1, §6.7 · DECISIONS #58, #62, #67, #72
- [ ] Hợp đồng: `POST /api/members`, `PUT /api/members/{id}`, `DELETE /api/members/{id}` (409 `MEMBER_ON_TREE`), `POST /api/files/sign`, `POST /api/files/confirm` (kind AVATAR).
- [ ] Handler giả lập:
  - Tạo và sửa: tính `search_name`. Ngày mất nhập âm mà có năm thì tự đổi sang dương, còn nhập dương thì tự đổi sang âm (bằng `utils/lunar`). Các trường về cái chết chỉ hợp lệ khi đã mất.
  - Xóa: chặn nếu có trên cây; xóa các dòng người thân liên quan (cả dòng trong hồ sơ người đó lẫn dòng người đó xuất hiện ở hồ sơ khác, sau khi Đợt 13 có store người thân) và ghi snapshot "đã xóa" vào store (dùng ở Đợt 23).
  - Upload: trả 503 "Cần kết nối máy chủ".
- [ ] `MemberForm` (RHF + Zod):
  - Chỉ họ tên bắt buộc. Giới tính có 3 lựa chọn Nam / Nữ / Chưa rõ.
  - Khối "Đã qua đời": ngày mất dùng `DualDateInput` (cho phép chỉ ngày/tháng âm), ngày giỗ ghi đè, nơi an táng.
  - Ngày sinh dùng `DualDateInput` (cho phép chỉ năm). Chọn sinh nhật Dương hoặc Âm.
  - Có tên húy, nhãn, tiểu sử, SĐT, email.
  - Tách nhóm "đã mất" (đã qua đời, ngày mất, ngày giỗ ghi đè, nơi an táng) thành một khối riêng trong form và trong schema, có prop `lockDeathFields` để Đợt 13 dùng cho User tự sửa hồ sơ (#76).
- [ ] Nút Xóa (chỉ Admin) kèm xác nhận. Khi bị chặn thì giải thích "Hãy gỡ người này khỏi cây trước".
- [ ] `AvatarUpload` (`components/shared`): chọn ảnh, kiểm tra định dạng và giới hạn 10 MB ngay ở máy, có preview. Ở chế độ giả lập thì báo "Cần kết nối máy chủ".
- [ ] Ở đợt này chỉ Admin thấy các nút Thêm, Sửa, Xóa. Nút "Sửa hồ sơ của tôi" cho User làm ở Đợt 13 (cần liên kết "Tôi là ai").
- [ ] Test: schema form (chỉ tên, đã mất không có ngày, ngày âm không năm), handler tự đổi ngày âm sang dương, handler xóa bị chặn.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin thêm một thành viên chỉ có họ tên: lưu được, và người đó hiện trong danh sách.
2. Sửa "Cụ Nguyễn Văn Tỵ": đặt giới tính Nam, lưu. F5 vẫn còn (dữ liệu nằm trong localStorage).
3. Nhập ngày mất âm 15/6 nhuận 2025: ngày dương được tự điền.
4. Xóa thành viên vừa thêm: xóa được. Đăng nhập bằng User: không thấy nút Thêm, Sửa, Xóa.
5. Chọn ảnh 12 MB: bị báo quá kích thước ngay.

**➡️ Đợt tiếp:** Đợt 13 — Người thân, "Tôi là ai" và tự sửa hồ sơ FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 13 — Người thân, "Tôi là ai" và tự sửa hồ sơ FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 13, roadmap/IDEA.md §6.1, §6.2, §6.3 và §6.7, docs/DECISIONS.md (#71, #75, #76, #78), .claude/rules/frontend.md và .claude/rules/security.md. Viết hợp đồng người thân và yêu cầu liên kết, bổ sung quyền chủ hồ sơ cho PUT /api/members/{id} và sign/confirm AVATAR; handler giả lập (danh sách một chiều, mỗi người một lần trong một hồ sơ, nhãn ≤50, chỉ chủ hồ sơ và Admin ghi, chặn User sửa nhóm "đã mất", bọc /api/me để gắn memberId); khối Người thân trên hồ sơ, nút "Sửa hồ sơ của tôi" (MemberForm với lockDeathFields), trang "Tôi là ai" và Quản trị > Yêu cầu liên kết. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 13. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 13 — Người thân, "Tôi là ai" và tự sửa hồ sơ FE ⬜
IDEA §6.1, §6.2, §6.3, §6.7 · DECISIONS #71, #75, #76, #78
- [ ] Hợp đồng:
  - Người thân: `GET /api/members/{id}/relatives` (mỗi dòng có `id`, người thân dạng `MemberSummary`, `label`), `POST /api/members/{id}/relatives` (`relativeMemberId`, `label`), `PUT /api/members/{id}/relatives/{relativeId}` (`label`), `DELETE /api/members/{id}/relatives/{relativeId}`. Lỗi: 409 `RELATIVE_EXISTS`, 400 khi tự thêm chính mình, 403 khi không phải chủ hồ sơ hay Admin.
  - Liên kết: `POST /api/link-requests`, `GET /api/link-requests/mine`, `DELETE /api/me/member-link`, và cho Admin `GET /api/link-requests?status=PENDING`, `POST /api/link-requests/{id}/approve`, `POST /api/link-requests/{id}/reject`.
  - `PUT /api/members/{id}`: bổ sung quyền của chủ hồ sơ (#76) và lỗi 403 `DEATH_FIELDS_ADMIN_ONLY`. `POST /api/files/sign` và `/confirm` với `kind=AVATAR`: chủ hồ sơ được gọi cho hồ sơ của mình (#78).
- [ ] Handler giả lập:
  - Người thân: một chiều; một người chỉ xuất hiện một lần trong danh sách của một hồ sơ; không tự thêm chính mình; nhãn bắt buộc, cắt khoảng trắng, dài ≤ 50 ký tự; người thân phải là thành viên đã có. Chỉ chủ hồ sơ (theo `memberId` của `/api/me` đã bọc) hoặc Admin được ghi.
  - Sửa hồ sơ: User chỉ sửa được hồ sơ của mình. Đổi giá trị ở nhóm "đã mất" thì trả 403 `DEATH_FIELDS_ADMIN_ONLY`, giá trị giữ nguyên thì bỏ qua.
  - Liên kết: không liên kết được thành viên đã có tài khoản khác.
  - **Bọc** `GET /api/me` để gắn `memberId` từ store.
  - Handler xóa thành viên (Đợt 12): dọn các dòng người thân ở cả hai phía.
- [ ] Khối **Người thân** trên hồ sơ:
  - danh sách "Tên — nhãn", mỗi tên là một link;
  - chủ hồ sơ và Admin có "Thêm người thân": chọn thành viên (tìm không dấu, loại chủ hồ sơ và những người đã có trong danh sách), nhập nhãn; sửa nhãn và xóa được;
  - người khác chỉ xem.
- [ ] **Tự sửa hồ sơ:** trên hồ sơ của chính mình, User thấy nút "Sửa hồ sơ của tôi". Nút mở `MemberForm` với `lockDeathFields`: nhóm "đã mất" chỉ để xem, kèm ghi chú "Chỉ Admin sửa được phần này". `AvatarUpload` cũng mở cho chủ hồ sơ (ở chế độ giả lập vẫn báo "Cần kết nối máy chủ").
- [ ] Trang **"Tôi là ai"** (menu Thêm): tìm thành viên, bấm "Đây là tôi", có trạng thái đang chờ, và hủy liên kết. Hồ sơ của chính mình có dấu "Đây là bạn".
- [ ] Quản trị > **Yêu cầu liên kết**: danh sách chờ, Duyệt, Từ chối, badge số đang chờ.
- [ ] Test: danh sách một chiều (thêm ở hồ sơ B không hiện ở hồ sơ A), chặn trùng, chặn tự thêm, User ghi vào hồ sơ người khác bị 403, User đổi nhóm "đã mất" bị 403, handler liên kết.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin mở hồ sơ "Nguyễn Văn Kỷ", thêm người thân "Cụ Nguyễn Văn Uyên" với nhãn "cha". Hồ sơ Kỷ hiện "Cụ Nguyễn Văn Uyên — cha". Hồ sơ Uyên không có dòng nào về Kỷ.
2. Thêm Uyên vào hồ sơ Kỷ lần nữa: bị báo đã có. Mở hồ sơ Uyên, thêm Kỷ với nhãn "con": thêm được.
3. Admin thêm một thành viên thử còn sống. User chọn "Đây là tôi" cho người đó, Admin duyệt ở Quản trị > Yêu cầu liên kết. Hồ sơ đó hiện "Đây là bạn".
4. User đó bấm "Sửa hồ sơ của tôi", sửa tiểu sử và lưu: có hiệu lực ngay. Nhóm "đã mất" bị khóa.
5. User đó thêm người thân vào hồ sơ của mình: thêm được. Mở hồ sơ người khác: không có nút sửa và không có nút thêm người thân.
6. *(Dữ liệu thử ở các bước trên chỉ để kiểm tra, xong thì "Khôi phục dữ liệu gốc".)*

**➡️ Đợt tiếp:** Đợt 14 — Cây FE: mô hình và thuật toán layout · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 14 — Cây FE: mô hình và thuật toán layout theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 14, roadmap/IDEA.md §8, docs/DECISIONS.md (#34, #60, #61), .claude/rules/frontend.md. Viết hợp đồng GET /api/tree, mô hình thuần utils/tree (đời theo độ sâu từng cây rời, kiểm tra hợp lệ mọi thao tác dựng cây, chặn vòng) kèm fixture dùng chung shared/fixtures/tree, và hàm thuần layoutTree (hàng đời, ô + vợ/chồng hai bên, con từ đúng cặp, ô trống, nhiều gốc, không chồng lấn), trang /dev/cay vẽ SVG thô. Trước khi code UI, đọc docs/DESIGN.md; thiết kế ưu tiên điện thoại. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 14. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 14 — Cây FE: mô hình và thuật toán layout ⬜
IDEA §8 · DECISIONS #34, #60, #61
- [ ] Hợp đồng `GET /api/tree`: trả `nodes` (`id`, `memberId|null`, `parentNodeId`, `coParentNodeId`, `sortOrder`, cùng tóm tắt thành viên gồm họ tên, giới tính, đã mất, năm sinh–mất, nhãn, avatar) và `spouses` (`nodeId`, `spouseNodeId`, `order`). Đời **không** nằm trong response, frontend tự tính.
- [ ] `src/utils/tree/` (hàm thuần, lớp giả lập và UI dùng chung):
  - tính đời theo từng cây rời; lấy tổ tiên, con cháu, nhánh;
  - danh sách thành viên chưa có trên cây;
  - kiểm tra hợp lệ cho mọi thao tác theo #60 và #61: "+ Cha/Mẹ" chỉ ở Đời 01, bắt buộc chọn cặp khi có ≥ 2 vợ/chồng, ô vợ/chồng không có "+ Vợ/Chồng", xóa ô trống, di chuyển chặn vòng, mỗi thành viên chỉ có một ô.
- [ ] `shared/fixtures/tree/`: các ca đồ thị kèm thao tác và kết quả mong đợi (hợp lệ, hoặc mã lỗi). Dùng lại cho backend ở Đợt 29. Tên trong fixture là "Ô 1, Ô 2…", không dùng người thật.
- [ ] `features/tree/layout/layoutTree.ts`: hàm thuần, kết quả xác định.
  - Đầu vào: đồ thị cùng options (`collapsedIds`, `rootNodeId`, `maxDepth`, `focusNodeId`).
  - Đầu ra: toạ độ các ô, đường nối (hôn nhân, cặp đến con, một mình cha/mẹ đến con), và `y` của từng hàng đời.
  - Quy tắc: mỗi đời một hàng. Đơn vị xếp là ô thuộc dòng cùng các vợ/chồng xếp hai bên theo `order`. Con đi xuống từ trung điểm của đúng cặp. Anh em xếp theo `sortOrder`. Ô trống có cùng kích thước. Nén cây con để không chồng lấn. Các cây rời đặt cạnh nhau.
- [ ] Vitest gồm các ca:
  - nhiều vợ, có con với từng vợ;
  - con không thuộc cặp nào;
  - ô trống vẫn có con cháu;
  - nhiều gốc (nối vợ chồng và không nối);
  - thêm cha/mẹ cho gốc thì đời dịch xuống;
  - thu gọn nhánh;
  - **không có ô nào chồng lấn**;
  - 500 ô chạy dưới 50 ms;
  - toàn bộ `shared/fixtures/tree/`.
- [ ] Trang `/dev/cay` (chỉ có ở chế độ dev): vẽ SVG thô từ các đồ thị trong fixture.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. `npm test -- tree`: xanh.
2. Mở `/dev/cay`, chọn ca "nhiều vợ + ô trống": con nối đúng từ trung điểm của cặp, ô trống có viền đứt, không có ô nào chồng lên nhau.
3. Chọn ca "2 gốc không nối": hai cây đứng cạnh nhau, cùng ở Đời 01.

**➡️ Đợt tiếp:** Đợt 15 — Cây FE: hiển thị và thêm người · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 15 — Cây FE: hiển thị và thêm người theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 15, roadmap/IDEA.md §8, docs/DECISIONS.md (#60, #71), .claude/rules/frontend.md. Viết hợp đồng các thao tác thêm (gốc, con, vợ/chồng, cha/mẹ), handler giả lập dùng utils/tree, trang Cây bằng React Flow hiển thị kết quả layoutTree (MemberNode, ô trống, cột Đời cố định, zoom/kéo/pinch), ba nút "+" cho Admin mở hộp chọn thành viên chưa có trên cây, chọn cặp khi có ≥2 vợ/chồng. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 15. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 15 — Cây FE: hiển thị và thêm người ⬜
IDEA §8 · DECISIONS #60, #71
- [ ] Hợp đồng: `POST /api/tree/roots`, `POST /api/tree/nodes/{id}/children` (có `coParentNodeId`), `POST /api/tree/nodes/{id}/spouses`, `POST /api/tree/nodes/{id}/parent`. Body chứa `memberId`. Lỗi trả ProblemDetail với mã như `TREE_NEEDS_CO_PARENT`, `TREE_PARENT_ONLY_AT_TOP`, `MEMBER_ALREADY_ON_TREE`.
- [ ] Handler giả lập cho `GET /api/tree` và các thao tác thêm. Store cây nằm trong localStorage và **lúc đầu trống**. Kiểm tra hợp lệ bằng `utils/tree`.
- [ ] Trang Cây:
  - React Flow chỉ hiển thị kết quả của `layoutTree`.
  - `MemberNode` theo DESIGN §5: họ tên nguyên văn, ảnh hoặc chữ cái đầu, người đã mất có viền xám và ✝ kèm năm mất, có nhãn.
  - Ô trống viền đứt. Ô của người chưa rõ giới tính vẽ trung tính.
  - Đường nối hôn nhân (kèm thứ tự) và đường cha mẹ–con.
- [ ] Cột trái cố định "Đời 01…N", đồng bộ trục y với viewport. Zoom, kéo, pinch. Bật `onlyRenderVisibleElements`.
- [ ] Cây trống:
  - User thấy trạng thái rỗng "Cây chưa được dựng".
  - Admin thấy nút **"+ Thêm người gốc"**, và thêm được nhiều gốc.
- [ ] Admin thấy ba nút "+" trên ô (dưới: Con, cạnh: Vợ/Chồng, trên: Cha/Mẹ), chỉ hiện ở chỗ được phép theo `utils/tree`.
  - Mỗi nút mở hộp chọn **thành viên chưa có trên cây**, có tìm không dấu. Hộp này là bottom sheet trên điện thoại.
  - "+ Con" trên người có ≥ 2 vợ/chồng thì hỏi thêm "Con với ai".
- [ ] Test: hiện "+" đúng chỗ, hộp chọn loại người đã có trên cây, handler thêm cha/mẹ làm cả cây dịch xuống một đời.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User vào Cây: thấy "Cây chưa được dựng".
2. Admin bấm "+ Thêm người gốc", chọn một người: người đó hiện ở Đời 01.
3. Bấm "+" cạnh để thêm 2 vợ/chồng, rồi bấm "+" dưới: phải hỏi "Con với ai". Con hiện đúng dưới cặp đã chọn.
4. Bấm "+" trên của người gốc: người mới thành Đời 01, cả cây dịch xuống. Ô ở Đời 02 không còn nút "+" trên.
5. Hộp chọn không còn những người đã có trên cây. Ở khổ 375px thì pinch và kéo đều mượt.
6. *(Xong thì "Khôi phục dữ liệu gốc" nếu chỉ thử nghiệm.)*

**➡️ Đợt tiếp:** Đợt 16 — Cây FE: chỉnh sửa và điều hướng · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 16 — Cây FE: chỉnh sửa và điều hướng theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 16, roadmap/IDEA.md §6.1 và §8, docs/DECISIONS.md (#60–62), .claude/rules/frontend.md. Viết hợp đồng và handler giả lập cho gỡ khỏi cây (ô trống), điền ô trống, xóa ô trống, di chuyển nhánh (kéo thả trên máy tính, menu trên điện thoại, chặn vòng), đổi thứ tự anh em, đổi cặp cha–mẹ; thêm thu gọn nhánh, tìm và nhảy tới, "Xem cây từ người này", "Xem tổ tiên của tôi", chế độ 3 đời trên điện thoại, khối "Trên cây" ở hồ sơ, lọc đời/có trên cây ở danh sách. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 16. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 16 — Cây FE: chỉnh sửa và điều hướng ⬜
IDEA §6.1, §8 · DECISIONS #60–62
- [ ] Hợp đồng:
  - `DELETE /api/tree/nodes/{id}/member` (gỡ khỏi cây, ô thành ô trống);
  - `PUT /api/tree/nodes/{id}/member` (điền ô trống);
  - `DELETE /api/tree/nodes/{id}` (xóa ô trống, lỗi `TREE_SLOT_NOT_EMPTY` hoặc `TREE_SLOT_HAS_LINKS`);
  - `POST /api/tree/nodes/{id}/move` (`newParentNodeId|null`, `coParentNodeId`; lỗi `TREE_CYCLE`);
  - `PUT /api/tree/nodes/{id}/order`;
  - `PUT /api/tree/nodes/{id}/co-parent`.

  Kèm handler giả lập.
- [ ] Menu khi bấm vào ô:
  - Mọi người thấy "Xem hồ sơ" và "Xem cây từ người này".
  - Admin thấy thêm "Gỡ khỏi cây", "Di chuyển nhánh", "Đổi thứ tự", "Đổi cặp cha–mẹ", và "Xóa ô" (với ô trống).
  - Bấm vào ô trống thì mở hộp chọn người để điền.
- [ ] Di chuyển nhánh:
  - Máy tính (≥ 1024px): kéo thả, hiện vùng thả hợp lệ, thả sai chỗ thì báo lý do.
  - Điện thoại: dùng menu "Di chuyển nhánh" rồi chọn ô đích hoặc "Thành gốc mới".
  - Luôn có hộp xác nhận ghi số người trong nhánh.
- [ ] Điều hướng:
  - thu gọn hoặc mở rộng từng nhánh;
  - ô tìm kiếm nhảy tới người cần tìm và làm nổi bật;
  - "Xem cây từ người này";
  - **"Xem tổ tiên của tôi"** (cần đã liên kết và có trên cây, nếu không thì giải thích lý do);
  - trên điện thoại mặc định hiện 3 đời quanh người được chọn (hoặc chính mình), chạm để mở rộng.
- [ ] Hồ sơ thành viên: khối **"Trên cây"** gồm đời, cha/mẹ, vợ/chồng, con theo cây, và nút "Xem trên cây". Người chưa có trên cây thì ghi rõ. Handler danh sách thành viên lọc được theo đời và theo có trên cây.
- [ ] Xóa thành viên đang có trên cây (Đợt 12) nay bị chặn thật.
- [ ] Test: gỡ khỏi cây giữ nguyên con cháu, chặn di chuyển vào trong chính nhánh, điều kiện xóa ô trống, đổi cặp, toàn bộ `shared/fixtures/tree/`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dựng một cây thử có 3 đời. Gỡ người ở giữa: ô của họ thành ô trống, con cháu vẫn nối vào ô trống, và người đó vẫn còn trong danh sách thành viên.
2. Bấm ô trống, điền một người khác: cây vẽ lại đúng.
3. Kéo một nhánh vào trong chính con cháu của nó: bị chặn. Kéo sang một ô khác: cả nhánh đi theo.
4. Xóa ô trống còn con: bị chặn. Xóa ô trống không còn liên kết: xóa được.
5. Liên kết tài khoản với một người trên cây rồi bấm "Xem tổ tiên của tôi": chỉ hiện đường đi lên các đời trên.
6. Ở khổ 375px chỉ thấy 3 đời, chạm để mở rộng.

**➡️ Đợt tiếp:** Đợt 17 — Lịch và sự kiện FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 17 — Lịch và sự kiện FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 17, roadmap/IDEA.md §6.5 và §7, docs/DECISIONS.md (#31, #65, #72), .claude/rules/frontend.md. Viết hợp đồng sự kiện chung và lịch (upcoming, month, recent), hàm thuần utils/occurrences (giỗ theo AnniversaryRules, sinh nhật, sự kiện chung, eventKey ổn định) kèm fixture dùng chung shared/fixtures/occurrences, handler giả lập, tab Sắp tới, tab Lịch tháng, form sự kiện chung cho Admin. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 17. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 17 — Lịch và sự kiện FE ⬜
IDEA §6.5, §7 · DESIGN §1 (màu sự kiện) · DECISIONS #31, #65, #72
- [ ] Hợp đồng:
  - CRUD `/api/events` (Admin ghi, mọi người đọc; `year = null` nghĩa là lặp hằng năm);
  - `GET /api/calendar/upcoming?days=7|15|30|90|365&type=&sort=asc|desc`;
  - `GET /api/calendar/month?year=&month=&mode=solar|lunar`;
  - `GET /api/calendar/recent?limit=10`.
- [ ] `src/utils/occurrences/` (hàm thuần): sinh các lần xảy ra trong một khoảng ngày.
  - **Giỗ:** người đã mất có ngày mất âm hoặc ngày ghi đè, theo `AnniversaryRules`. Ghi "giỗ lần thứ N" nếu biết năm mất.
  - **Sinh nhật:** người còn sống có ngày/tháng sinh. Ghi "tròn N tuổi" nếu biết năm sinh.
  - **Sự kiện chung.**
  - Mỗi lần xảy ra có một `eventKey` ổn định.
- [ ] `shared/fixtures/occurrences/`: các ca đầu vào kèm kết quả mong đợi (vắt qua năm, tháng nhuận, ngày 30 dời sang 29, 29/2, ngày ghi đè, giỗ không có năm). Backend dùng lại ở Đợt 31.
- [ ] Handler giả lập cho sự kiện và lịch, dùng `utils/occurrences` trên store.
- [ ] Tab **"Sắp tới"**:
  - chọn khoảng thời gian, lọc theo loại, sắp xếp;
  - mỗi dòng có icon và màu theo loại, kèm "còn N ngày", "giỗ lần thứ N", "tròn N tuổi".
- [ ] Tab **"Lịch tháng"**:
  - mỗi ô có ngày dương lớn, ngày âm nhỏ và chấm màu;
  - nút gạt "Xem theo âm";
  - bấm vào ngày thì mở sheet danh sách sự kiện;
  - dưới 768px hiện danh sách theo tuần.
- [ ] Form sự kiện chung (chỉ Admin): dùng `DualDateInput`, chọn lặp hằng năm hoặc một lần, có sửa và xóa. Chú giải màu có kèm chữ.
- [ ] Test: toàn bộ fixture occurrences. Riêng "Cụ Nguyễn Thị Thêm" (01/11 âm, không năm) có giỗ mỗi năm nhưng không có "lần thứ N".

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Vào Lịch > Sắp tới, chọn "Cả năm": thấy giỗ của các cụ có ngày mất (ví dụ "Giỗ Cụ Nguyễn Văn Sửu — 11/7 âm — giỗ lần thứ N").
2. Lịch tháng 12 âm (bật "Xem theo âm"): có giỗ Bà Trần Thị Nhung (29/12) và Nguyễn Văn Thông (29/12).
3. Admin tạo sự kiện "Giỗ tổ" lặp hằng năm theo âm: sự kiện hiện ở cả hai tab.
4. Ở khổ 375px, lịch tháng chuyển thành danh sách theo tuần.

**➡️ Đợt tiếp:** Đợt 18 — Dashboard FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`, `dataviz`
```text
Làm Đợt 18 — Dashboard FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 18, roadmap/IDEA.md §6.8, docs/DECISIONS.md (#71), .claude/rules/frontend.md. Viết hợp đồng GET /api/dashboard, handler giả lập (tổng, sống/mất, số người trên cây, số đời, sự kiện; số chờ duyệt cho Admin), trang Tổng quan với stat tile, thẻ Sắp tới đếm ngược, danh sách 30 ngày và 10 sự kiện vừa qua, thẻ Chờ duyệt cho Admin. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 18. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, dataviz. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 18 — Dashboard FE ⬜
IDEA §6.8 · DECISIONS #71
- [ ] Hợp đồng `GET /api/dashboard`:
  - `totalMembers`, `living`, `deceased`, `onTree`, `maxGeneration`;
  - `nextEvent`, `recentEvents[10]`, `upcoming30[]`;
  - riêng Admin có thêm `pendingAccounts`, `pendingProposals`, `pendingLinkRequests`.
- [ ] Handler giả lập tính từ store. Riêng `pendingAccounts` lấy từ backend thật (`/api/admin/accounts?approval=WAITING`). `pendingProposals` bằng 0 cho tới Đợt 20.
- [ ] Trang Tổng quan:
  - hàng stat tile (theo dataviz, số dạng tabular);
  - thẻ navy "Sắp tới" có đếm ngược;
  - danh sách 30 ngày tới và danh sách 10 sự kiện vừa qua.
  - Admin có thẻ "Chờ duyệt" gồm 3 số, bấm vào dẫn tới trang tương ứng.
  - Có trạng thái rỗng khi cây còn trống.
- [ ] Test: handler tính số liệu đúng (28 người, 0 còn sống, 0 trên cây lúc đầu), thẻ Chờ duyệt ẩn với User.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tổng quan với dữ liệu gốc: Tổng 28, Còn sống 0, Đã mất 28, Trên cây 0.
2. Admin thêm một người vào cây, quay lại Tổng quan: Trên cây 1, Số đời 1.
3. Có tài khoản chờ duyệt: thẻ Chờ duyệt của Admin hiện đúng số, bấm vào mở Quản trị > Tài khoản.
4. Kiểm tra ở khổ 375px và 1280px, số không bị nhảy độ rộng.

**➡️ Đợt tiếp:** Đợt 19 — PWA · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 19 — PWA theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 19, roadmap/IDEA.md §1 và §9, docs/DECISIONS.md (#38), .claude/rules/frontend.md. Cấu hình vite-plugin-pwa theo kiểu injectManifest (để Đợt 21 thêm xử lý push), manifest + icon, precache app shell, NetworkFirst cho GET /api/** trừ /api/auth/**, toast có bản mới, banner offline, hướng dẫn cài theo thiết bị. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 19. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 19 — PWA ⬜
IDEA §1, §9 · DECISIONS #38
- [ ] `vite-plugin-pwa` theo kiểu **injectManifest**, có sẵn chỗ cho handler `push` ở Đợt 21. Manifest gồm tên "Tộc Phả", `theme_color` là màu primary, `display: standalone`, và bộ icon 192/512/maskable.
- [ ] Service worker precache app shell. Dùng NetworkFirst cho `GET /api/**`, trừ `/api/auth/**` và `/api/me`. Không cache request ghi. Ở chế độ giả lập không đăng ký service worker.
- [ ] Toast "Có bản mới" kèm nút tải lại. Banner "Đang offline — dữ liệu có thể cũ".
- [ ] Hướng dẫn cài: Android và máy tính dùng `beforeinstallprompt`, iOS hiện hướng dẫn "Chia sẻ → Thêm vào MH chính".
- [ ] Chạy Lighthouse trên bản build: đạt tiêu chí cài đặt PWA, Performance trên mobile ≥ 80.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. `npm run build && npm run preview`, mở Chrome: có biểu tượng cài đặt, cài được.
2. Tắt mạng (DevTools Offline): hiện banner offline, các trang đã xem vẫn mở được.
3. Build lại có thay đổi: toast "Có bản mới" hiện ra.

**➡️ Đợt tiếp:** Đợt 20 — Đề xuất sự kiện FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 20 — Đề xuất sự kiện FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 20, roadmap/IDEA.md §6.6, docs/DECISIONS.md (#65, #71, #77), .claude/rules/frontend.md. Viết hợp đồng /api/proposals (chỉ targetType EVENT), handler giả lập (tính diff, áp dụng vào store khi duyệt, báo xung đột), thêm mode direct|proposal cho form sự kiện, trang Đề xuất của tôi, Quản trị > Đề xuất (diff 2 cột, sửa, duyệt, từ chối, cảnh báo xung đột). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 20. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 20 — Đề xuất sự kiện FE ⬜
IDEA §6.6 · DECISIONS #65, #71, #77
- [ ] Hợp đồng:
  - `POST /api/proposals` (`targetType` chỉ có `EVENT`, `action` CREATE|UPDATE|DELETE, `targetId`, `payload`);
  - `GET /api/proposals/mine`;
  - cho Admin: `GET /api/proposals?status=PENDING`, `GET /api/proposals/count`, `POST /api/proposals/{id}/approve` (có thể gửi kèm payload đã chỉnh), `POST /api/proposals/{id}/reject` (kèm `note`).
- [ ] Handler giả lập:
  - tính diff, lưu `baseUpdatedAt`;
  - khi duyệt thì áp dụng vào store sự kiện;
  - báo `conflict` nếu sự kiện đã bị sửa sau `baseUpdatedAt`.
- [ ] Thêm `mode: 'direct' | 'proposal'` cho form sự kiện. User thấy "Đề xuất sự kiện" (thêm mới) và "Đề xuất sửa/xóa" trên từng sự kiện. Không cần liên kết "Tôi là ai".
- [ ] Trang **"Đề xuất của tôi"**: hiện trạng thái và lý do bị từ chối.
- [ ] Quản trị > **Đề xuất**:
  - hàng đợi, và badge trên menu;
  - trang chi tiết có diff 2 cột, sửa payload, Duyệt, Từ chối kèm lý do;
  - banner cảnh báo khi `conflict`.
  - Tổng quan lấy `pendingProposals` là số thật.
- [ ] Test: User không duyệt được, duyệt áp dụng đúng vào sự kiện, xung đột, `targetType` khác EVENT bị từ chối.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User (chưa liên kết cũng được) đề xuất sự kiện "Họp họ đầu năm" ngày 10/1 âm. Admin duyệt: sự kiện hiện trên lịch, User thấy trạng thái "Đã duyệt".
2. User đề xuất đổi địa điểm của sự kiện đó. Admin từ chối kèm lý do: User thấy lý do.
3. Admin sửa sự kiện trong lúc một đề xuất sửa đang chờ: mở đề xuất đó thấy banner xung đột.

**➡️ Đợt tiếp:** Đợt 21 — Thông báo FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 21 — Thông báo FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 21, roadmap/IDEA.md §9, docs/DECISIONS.md (#72), .claude/rules/frontend.md. Viết hợp đồng hộp thư, tùy chọn và push; handler giả lập (hộp thư rỗng, lưu tùy chọn, push báo cần máy chủ); chuông + badge, trang hộp thư, trang Cài đặt thông báo, xử lý push/notificationclick trong service worker, hướng dẫn bật thông báo theo thiết bị. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 21. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 21 — Thông báo FE ⬜
IDEA §9 · DECISIONS #72
- [ ] Hợp đồng:
  - `GET /api/notifications` (phân trang), `GET /api/notifications/unread-count`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`;
  - `GET/PUT /api/notifications/preferences`;
  - `GET /api/push/public-key`, `POST/DELETE /api/push/subscribe`, `POST /api/push/test`.
- [ ] Handler giả lập: hộp thư rỗng (không tạo thông báo giả), tùy chọn lưu vào store, các endpoint push trả 503 "Cần kết nối máy chủ".
- [ ] Chuông trên Header và BottomNav, có badge số chưa đọc (refetch khi cửa sổ được focus lại). Trang hộp thư có "Đánh dấu đã đọc hết", bấm vào thông báo thì đi tới `link`.
- [ ] Trang Cài đặt thông báo:
  - công tắc cho 3 loại, các mốc nhắc, giờ nhận;
  - trạng thái "Thiết bị này: đã/chưa nhận thông báo";
  - nút "Bật thông báo" (xin quyền rồi subscribe) và nút "Gửi thử".
- [ ] Service worker: sự kiện `push` thì hiện notification, `notificationclick` thì mở hoặc focus app tại `link`.
- [ ] Hướng dẫn ở lần đăng nhập đầu, tùy thiết bị:
  - Android và máy tính: bấm "Cho phép".
  - iOS dưới 16.4: báo không hỗ trợ.
  - iOS từ 16.4 mà chưa cài app: hướng dẫn "Thêm vào MH chính" trước.
- [ ] Test: nhận diện thiết bị cho phần hướng dẫn, form tùy chọn, parser payload push trong service worker (dùng dữ liệu test).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Chuông hiện 0. Hộp thư có trạng thái rỗng.
2. Tắt "Sinh nhật", đổi giờ nhận thành 20h, F5: vẫn giữ nguyên.
3. Bấm "Bật thông báo" ở chế độ giả lập: xin quyền được, nhưng subscribe báo "Cần kết nối máy chủ".
4. Mô phỏng thiết bị iPhone iOS 16.4 chưa cài app: hướng dẫn đúng.

**➡️ Đợt tiếp:** Đợt 22 — Đính kèm FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`, `dataviz`
```text
Làm Đợt 22 — Đính kèm FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 22, roadmap/IDEA.md §6.7, docs/DECISIONS.md (#67, #72), .claude/rules/frontend.md và .claude/rules/security.md. Viết hợp đồng tệp của thành viên, tài liệu chung, xóa, quota, link tải có chữ ký; handler giả lập (danh sách rỗng, upload cần máy chủ); tab Tệp đính kèm, trang Tài liệu chung, upload kéo thả có tiến độ (chỉ Admin), lightbox, thanh quota 1 GB. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 22. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, dataviz. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 22 — Đính kèm FE ⬜
IDEA §6.7 · DECISIONS #67, #72
- [ ] Hợp đồng:
  - mở rộng sign/confirm cho `kind=DOCUMENT` (có `title`, `memberId|null`);
  - `GET /api/members/{id}/attachments`, `GET /api/attachments/common`, `DELETE /api/attachments/{id}`;
  - `GET /api/attachments/{id}/download` (trả URL có chữ ký, hết hạn sau thời gian ngắn);
  - `GET /api/files/quota`.
- [ ] Handler giả lập: danh sách rỗng, quota 0 / 1 GB, upload và tải về trả 503 "Cần kết nối máy chủ".
- [ ] Tab **"Tệp đính kèm"** trên hồ sơ: lưới ảnh thu nhỏ và danh sách tài liệu.
  - Admin upload bằng kéo thả hoặc chọn file, có thanh tiến độ.
  - Báo lỗi ngay khi sai định dạng hoặc quá 10 MB.
- [ ] Xem trước: ảnh mở bằng lightbox, PDF mở ở tab mới, docx/xlsx thì tải về. Admin có nút xóa kèm xác nhận.
- [ ] Trang **"Tài liệu chung"** (menu Thêm).
- [ ] Thanh quota "x MB / 1 GB" dạng meter theo dataviz, có kèm chữ (hiện cho Admin).
- [ ] Test: kiểm tra định dạng và kích thước ở máy, meter ở các mức 0% và 100%.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Hồ sơ bất kỳ > Tệp đính kèm: có trạng thái rỗng. User không thấy nút tải lên.
2. Admin kéo thả file `.exe`: bị báo sai định dạng ngay. Kéo file PDF 11 MB: bị báo quá kích thước.
3. Kéo file PDF hợp lệ: báo "Cần kết nối máy chủ".
4. Thanh quota hiện "0 MB / 1 GB" và đọc được bằng trình đọc màn hình.

**➡️ Đợt tiếp:** Đợt 23 — Quản trị FE: hàng đợi, đã xóa, cấu hình · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`, `security-review`
```text
Làm Đợt 23 — Quản trị FE: hàng đợi, đã xóa, cấu hình theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 23, roadmap/IDEA.md §6.10, docs/DECISIONS.md (#55, #62), .claude/rules/frontend.md và .claude/rules/security.md. Viết hợp đồng cấu hình hệ thống và thành viên đã xóa, handler giả lập, trang Quản trị tổng (có badge), Thành viên đã xóa (xem snapshot), Cấu hình; rà toàn khu Quản trị chỉ Admin vào được. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 23. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 23 — Quản trị FE: hàng đợi, đã xóa, cấu hình ⬜
IDEA §6.10 · DECISIONS #55, #62
- [ ] Hợp đồng:
  - `GET/PUT /api/admin/settings` (`policyVersion`, `aiQuotaUser`, `aiQuotaAdmin`, `uploadMaxMb`, `totalQuotaMb`);
  - `GET /api/admin/deleted-members` và `GET /api/admin/deleted-members/{auditId}`.
- [ ] Handler giả lập: cấu hình lưu vào store; danh sách đã xóa lấy từ các snapshot mà thao tác xóa ở Đợt 12 đã ghi.
- [ ] Trang **Quản trị** tổng: các thẻ dẫn tới Tài khoản, Yêu cầu liên kết, Đề xuất, Thành viên đã xóa, Cấu hình. Mỗi thẻ có badge số đang chờ.
- [ ] **Thành viên đã xóa:** danh sách (ai xóa, lúc nào), bấm vào xem snapshot gồm thông tin, các dòng người thân liên quan và danh sách tệp.
- [ ] **Cấu hình:** form RHF + Zod. Khi đổi phiên bản chính sách thì cảnh báo rằng mọi người sẽ phải đồng ý lại.
- [ ] Rà cả khu Quản trị: guard route, ẩn menu với User, không có đường nào tới trang Admin từ giao diện của User.
- [ ] Test: guard route, schema cấu hình.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin xóa một thành viên thử (không có trên cây), rồi mở Quản trị > Thành viên đã xóa: thấy snapshot.
2. Đổi lượt AI của User thành 20: lưu được.
3. User gõ thẳng URL của từng trang quản trị: đều bị chặn.

**➡️ Đợt tiếp:** Đợt 24 — Trợ lý AI FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `security-review`
```text
Làm Đợt 24 — Trợ lý AI FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 24, roadmap/IDEA.md §10, docs/DECISIONS.md (#72, #73, #77), .claude/rules/frontend.md và .claude/rules/security.md. Viết hợp đồng chat SSE, quota, lịch sử, draft submit/apply; handler giả lập (chat báo cần máy chủ, quota theo vai trò); trang Trợ lý (luồng chat, chip gợi ý, đọc SSE bằng fetch + ReadableStream có Bearer và refresh, nút Dừng, markdown an toàn, thẻ draft, còn N câu). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 24. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 24 — Trợ lý AI FE ⬜
IDEA §10 · DECISIONS #72, #73, #77
- [ ] Hợp đồng:
  - `POST /api/ai/chat` trả `text/event-stream`, gồm các event `token`, `draft`, `done`, `error`;
  - `GET /api/ai/quota`, `GET /api/ai/messages`;
  - `POST /api/ai/drafts/{id}/submit` (User) và `POST /api/ai/drafts/{id}/apply` (Admin).
- [ ] Handler giả lập: chat trả 503 "Cần kết nối máy chủ", quota trả 15 hoặc 30 theo vai trò, lịch sử rỗng.
- [ ] Trang **"Trợ lý"** (menu Thêm và sidebar):
  - luồng chat, các chip gợi ý câu hỏi;
  - ô nhập dính ở đáy, trên điện thoại không bị bàn phím che;
  - ở chế độ giả lập hiện banner "Cần kết nối máy chủ".
- [ ] Đọc SSE bằng `fetch` + `ReadableStream`: gắn Bearer, gặp 401 thì refresh rồi thử lại, chữ hiện dần, có nút Dừng. Render markdown **an toàn** (không có HTML thô, link chỉ nhận http/https).
- [ ] Thẻ xem trước draft: có diff, nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Admin). Sau khi bấm thì thẻ chuyển sang trạng thái đã xử lý.
- [ ] Hiện "Còn N câu hôm nay". Hết lượt thì khóa ô nhập và ghi giờ reset (0h giờ Việt Nam).
- [ ] Test: parser SSE với luồng mẫu (bị cắt giữa chừng, nhiều event trong một chunk), chặn XSS trong markdown, trạng thái hết lượt.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở Trợ lý ở khổ 375px: ô nhập nằm ở đáy, có chip gợi ý, có banner cần máy chủ.
2. User thấy "Còn 15 câu hôm nay", Admin thấy 30.
3. Gửi câu hỏi: báo lỗi thân thiện, không treo giao diện.

**➡️ Đợt tiếp:** Đợt 25 — Export FE và in cây khổ lớn · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `anthropic-skills:pdf`
```text
Làm Đợt 25 — Export FE và in cây khổ lớn theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 25, roadmap/IDEA.md §6.9 và §8, docs/DECISIONS.md (#34, #72), .claude/rules/frontend.md. Viết hợp đồng 4 báo cáo (members.xlsx, events.xlsx, members.pdf, memorials.pdf), handler giả lập báo cần máy chủ, trang Xuất dữ liệu, và In cây chạy hoàn toàn ở máy: dùng lại layoutTree, SVG vector nhúng font, PDF A3/A2 chia trang có dấu cắt ghép, PNG ~300 dpi, chạy trong Web Worker. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app ở chế độ giả lập và kiểm tra ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 25. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, anthropic-skills:pdf. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 25 — Export FE và in cây khổ lớn ⬜
IDEA §6.9, §8 · DECISIONS #34, #72
- [ ] Hợp đồng: `GET /api/reports/members.xlsx`, `GET /api/reports/events.xlsx?year=`, `GET /api/reports/members.pdf`, `GET /api/reports/memorials.pdf?lunarYear=`. Handler giả lập trả 503 "Cần kết nối máy chủ".
- [ ] Trang **"Xuất dữ liệu"** (menu Thêm): 4 nút tải (chọn năm hoặc năm âm), có trạng thái đang tải. Ở chế độ giả lập thì báo cần máy chủ.
- [ ] **"In cây"** (từ trang Cây), chạy được đầy đủ ở chế độ giả lập vì tính hoàn toàn ở máy:
  - chọn gốc, khổ A3 hoặc A2, dọc hoặc ngang, có hoặc không có ảnh;
  - dùng lại `layoutTree` và render sang SVG vector (nhúng font Be Vietnam Pro);
  - xuất PDF (cây quá lớn thì chia trang theo khổ, có dấu cắt ghép) và PNG khoảng 300 dpi;
  - có cột "Đời" và tiêu đề.
- [ ] Chạy trong Web Worker hoặc chia nhỏ công việc để không treo giao diện với 500 ô.
- [ ] Test: tính số trang theo khổ giấy, SVG có đủ chữ có dấu.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dựng một cây thử vài đời, bấm In cây, chọn A3 ngang: file PDF mở ra với chữ có dấu đúng và nét vector (phóng to không vỡ).
2. Chọn PNG: ảnh rõ khi in.
3. Trang Xuất dữ liệu ở chế độ giả lập: báo cần máy chủ.

**➡️ Đợt tiếp:** Đợt 26 — Gỡ dòng họ BE và test hợp đồng · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 26 — Gỡ dòng họ BE và test hợp đồng theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 26, docs/DECISIONS.md (#54, #57, #63, #70, #74), .claude/rules/backend.md và .claude/rules/security.md. Xóa module family và mọi chỗ dùng familyId/familyRole/ROLE_MANAGER, thêm file Flyway V mới xóa bảng family/family_invitation và các cột family_id, family_role, hide_maternal_line (không sửa V3), viết ContractTest so /v3/api-docs với shared/api/openapi.yaml (có danh sách endpoint chưa làm, rút dần qua các đợt), sửa annotation cho khớp hợp đồng. Chỉ làm checklist Đợt 26. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN B — BACKEND

> Mỗi đợt BE làm đúng những endpoint mà `shared/api/openapi.yaml` đã có. Xong endpoint nào thì bỏ nó khỏi danh sách "chưa làm" của `ContractTest`.
> Hành vi phải giống handler giả lập. Chỗ nào giả lập sai so với IDEA/DECISIONS thì sửa theo IDEA/DECISIONS và ghi vào ✅ Đã làm.

### Đợt 26 — Gỡ dòng họ BE và test hợp đồng ⬜
DECISIONS #54, #57, #63, #70, #74
- [ ] Xóa module `family`: code, test, `FamilyFacade` và mọi chỗ gọi tới nó. Bỏ claim `familyId` và `familyRole`, bỏ `ROLE_MANAGER` trong `SecurityConfig`, bỏ `app.family.*`. `CurrentUser` không còn `familyId`.
- [ ] `V5__drop_family.sql`:
  - bỏ FK rồi xóa bảng `family_invitation` và `family`;
  - bỏ các cột `user_account.family_id`, `family_role`, `hide_maternal_line`;
  - bỏ `user_consent.family_id`;
  - bỏ `audit_log.family_id` cùng index của nó.
  - Entity phải khớp (`ddl-auto: validate`).
- [ ] `ContractTest`:
  - Khởi động app, tải `/v3/api-docs` và so với `shared/api/openapi.yaml`. Mọi path + method **đã làm** phải khớp về tham số, mã trạng thái và schema của body.
  - Endpoint có trong hợp đồng mà backend chưa làm thì nằm trong danh sách `NOT_YET_IMPLEMENTED`. Endpoint có ở backend mà không có trong hợp đồng thì test đỏ.
- [ ] Sửa annotation springdoc của auth, me, calendar, admin/accounts cho khớp hợp đồng.
- [ ] Test: `/api/family/**` trả 404, JWT không còn claim family, `ContractTest` xanh.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có (DB dev chạy thêm V5 khi khởi động).

**🧪 Test thủ công (từng bước):**
1. Chạy backend: Flyway áp dụng V5, app khởi động được.
2. Đăng nhập, giải mã access token: không còn `familyId` và `familyRole`.
3. Chạy frontend ở chế độ **thật** (không mock): đăng nhập, trang chờ duyệt và Quản trị > Tài khoản vẫn chạy.
4. `.\mvnw.cmd test -Dtest=ContractTest`: xanh.

**➡️ Đợt tiếp:** Đợt 27 — Thành viên BE + seed 28 người · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 27 — Thành viên BE + seed 28 người theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 27, roadmap/IDEA.md §4, §6.1 và Phụ lục A, docs/DECISIONS.md (#58, #62, #66, #68, #74), .claude/rules/backend.md. Tạo bảng member (khớp hợp đồng), migration seed sinh từ shared/fixtures/seed/members.json bằng script (không sửa tay) kèm test đối chiếu, CRUD + danh sách tìm không dấu, ẩn SĐT/email theo quyền, xóa phát MemberDeletedEvent và hỏi MemberDeletionGuard, audit log. Chỉ làm checklist Đợt 27. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 27 — Thành viên BE + seed 28 người ⬜
IDEA §4, §6.1, Phụ lục A · DECISIONS #58, #62, #66, #68, #74
- [ ] `V6__member.sql`: bảng `member` theo IDEA §4, có index `search_name`. Thêm FK và UNIQUE cho `user_account.member_id`.
- [ ] `V7__seed_members.sql` **sinh bằng script** `shared/fixtures/seed/to-sql.mjs` từ `members.json` (cách chạy ghi trong README), không sửa tay. `SeedMembersTest` so DB với JSON: đủ 28 người, họ tên, ngày mất âm và dương, nơi an táng, `is_deceased`.
- [ ] CRUD theo hợp đồng (ở đợt này chỉ Admin ghi, quyền chủ hồ sơ tự sửa làm ở Đợt 28):
  - `search_name` do Service chuẩn hóa;
  - ngày mất nhập theo một lịch thì tự điền lịch còn lại qua `CalendarFacade`, trừ khi không có năm;
  - các trường về cái chết chỉ hợp lệ khi đã mất.
- [ ] `GET /api/members` và `GET /api/members/{id}`: tìm không dấu, lọc, sắp xếp, phân trang. Riêng lọc `generation` và `onTree` để lại cho Đợt 29 (nằm trong `NOT_YET_IMPLEMENTED` dạng tham số). SĐT và email chỉ trả cho Admin và chính chủ.
- [ ] Xóa:
  - hỏi các bean `MemberDeletionGuard` (Đợt 29 thêm guard của cây);
  - ghi snapshot vào audit log;
  - phát `MemberDeletedEvent` trong transaction để các đợt sau tự dọn người thân, liên kết, tệp.
- [ ] Viết `MemberFacade`. Ghi audit log khi tạo, sửa, xóa.
- [ ] Test:
  - tìm "nguyen van tham";
  - User không ghi được (403);
  - tài khoản chưa duyệt nhận 403;
  - ẩn SĐT/email;
  - ngày âm không có năm;
  - seed;
  - `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Chạy backend: bảng `member` có đúng 28 dòng.
2. Chạy frontend ở chế độ thật, vào Thành viên: có 28 người như ở chế độ giả lập.
3. Admin thêm, sửa, xóa một người: làm được. User không thấy các nút này, và gọi thẳng API thì nhận 403.

**➡️ Đợt tiếp:** Đợt 28 — Người thân, "Tôi là ai" và tự sửa hồ sơ BE · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 28 — Người thân, "Tôi là ai" và tự sửa hồ sơ BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 28, roadmap/IDEA.md §6.1, §6.2 và §6.3, docs/DECISIONS.md (#62, #74, #75, #76), .claude/rules/backend.md và .claude/rules/security.md. Làm bảng member_relative (một chiều, UNIQUE(member_id, relative_member_id), không tự thêm, nhãn ≤50) và member_link_request, API theo hợp đồng, quyền chủ hồ sơ (user.member_id đọc từ DB) cho PUT /api/members/{id} và API người thân, chặn User sửa nhóm "đã mất" (403 DEATH_FIELDS_ADMIN_ONLY), /api/me trả memberId thật, listener MemberDeletedEvent xóa người thân ở cả hai phía, hủy yêu cầu và gỡ liên kết. Chỉ làm checklist Đợt 28. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 28 — Người thân, "Tôi là ai" và tự sửa hồ sơ BE ⬜
IDEA §6.1, §6.2, §6.3 · DECISIONS #62, #74, #75, #76
- [ ] `V8__relative_link.sql`: `member_relative` (`UNIQUE(member_id, relative_member_id)`, CHECK không tự thêm, FK tới `member`) và `member_link_request`.
- [ ] API người thân theo hợp đồng. Chủ hồ sơ (`user.member_id` đọc từ DB) và Admin được ghi, mọi tài khoản đã duyệt được đọc. Ghi audit log.
- [ ] Quyền chủ hồ sơ cho `PUT /api/members/{id}` (#76):
  - User chỉ sửa được hồ sơ của mình, sửa hồ sơ người khác thì 403;
  - nhóm "đã mất" đổi giá trị thì 403 `DEATH_FIELDS_ADMIN_ONLY`, giữ nguyên thì bỏ qua;
  - Admin sửa được mọi trường của mọi hồ sơ.
- [ ] API yêu cầu liên kết theo hợp đồng:
  - không liên kết được thành viên đã có tài khoản;
  - Admin duyệt thì gán `user.member_id` (UNIQUE chống đua);
  - có hủy liên kết.
  - `/api/me` trả `memberId`.
- [ ] Listener `MemberDeletedEvent`: xóa các dòng người thân ở cả hai phía, hủy các yêu cầu đang chờ, gỡ `user.member_id`.
- [ ] Test: trùng người trong một hồ sơ, tự thêm chính mình, nhãn quá 50 ký tự, User ghi vào hồ sơ người khác bị 403, User đổi nhóm "đã mất" bị 403, User chưa liên kết không sửa được hồ sơ nào, hai Admin duyệt song song cho cùng một thành viên, xóa thành viên thì dọn sạch, phân quyền, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: lặp lại các bước 🧪 của Đợt 13, kết quả phải giống ở chế độ giả lập.
2. Xóa một thành viên đang có trong danh sách người thân của người khác: hồ sơ của người kia không còn dòng đó.

**➡️ Đợt tiếp:** Đợt 29 — Cây BE · Model **Opus** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 29 — Cây BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 29, roadmap/IDEA.md §8, docs/DECISIONS.md (#60–62, #74), .claude/rules/backend.md. Làm bảng tree_node và tree_spouse, GET /api/tree (một truy vấn, 500 ô dưới 300 ms), mọi thao tác dựng cây theo hợp đồng với quy tắc giống utils/tree (chạy toàn bộ shared/fixtures/tree), khóa khi thao tác đồng thời, MemberDeletionGuard chặn xóa người đang có trên cây, lọc generation/onTree ở danh sách thành viên, audit log. Chỉ làm checklist Đợt 29. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 29 — Cây BE ⬜
IDEA §8 · DECISIONS #60–62, #74
- [ ] `V9__tree.sql`: `tree_node` (`member_id` NULL UNIQUE, FK tự tham chiếu), `tree_spouse` (`spouse_node_id` UNIQUE).
- [ ] `GET /api/tree`: tải toàn bộ bằng một truy vấn, dựng đồ thị trong bộ nhớ. Test với 500 ô phải chạy dưới 300 ms.
- [ ] Các thao tác ghi theo hợp đồng (thêm gốc, con, vợ/chồng, cha/mẹ, gỡ, điền, xóa ô trống, di chuyển, đổi thứ tự, đổi cặp):
  - chỉ Admin được làm;
  - quy tắc giống hệt `utils/tree`: `TreeRulesTest` chạy toàn bộ `shared/fixtures/tree/`;
  - khóa các dòng liên quan (`SELECT … FOR UPDATE`) để hai Admin thao tác cùng lúc không làm hỏng cây;
  - ghi audit log.
- [ ] `TreeDeletionGuard` (hiện thực `MemberDeletionGuard`): chặn xóa người đang có trên cây, trả 409 `MEMBER_ON_TREE`.
- [ ] Danh sách thành viên: lọc theo `generation` và `onTree` (đời tính theo cùng thuật toán). Bỏ các tham số này khỏi `NOT_YET_IMPLEMENTED`.
- [ ] Test: fixture chung, chặn vòng, "+ Cha/Mẹ" chỉ ở Đời 01, bắt buộc chọn cặp, thao tác song song, phân quyền, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: lặp lại các bước 🧪 của Đợt 15 và 16, kết quả phải giống ở chế độ giả lập.
2. Hai cửa sổ Admin cùng di chuyển hai nhánh chồng lên nhau: một cái thành công, cái kia báo lỗi rõ ràng, và cây không bị hỏng.

**➡️ Đợt tiếp:** Đợt 30 — Upload và đính kèm BE · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 30 — Upload và đính kèm BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 30, roadmap/IDEA.md §6.7, docs/DECISIONS.md (#62, #67, #74), .claude/rules/backend.md và .claude/rules/security.md. Làm bảng attachment, sign/confirm Cloudinary (xác minh public_id, MIME, ≤10 MB, folder giapha/, quota 1 GB toàn hệ thống), avatar (Admin, hoặc chủ hồ sơ cho ảnh của mình theo #78), tài liệu của thành viên và tài liệu chung, link tải có chữ ký, xóa, FileStorage có bản giả cho test, listener MemberDeletedEvent xóa tệp sau commit. Chỉ làm checklist Đợt 30. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 30 — Upload và đính kèm BE ⬜
IDEA §6.7 · DECISIONS #62, #67, #74
- [ ] `V10__attachment.sql`: bảng `attachment` (`kind` AVATAR|DOCUMENT, `member_id` NULL nghĩa là tài liệu chung).
- [ ] `POST /api/files/sign`: cấp chữ ký Cloudinary, folder `giapha/`, kiểm tra quota trước khi cấp.
- [ ] `POST /api/files/confirm`: xác minh `public_id` bằng Cloudinary Admin API (định dạng, ≤ 10 MB, đúng folder) rồi lưu. AVATAR thì cập nhật `member.avatar_url` và xóa ảnh cũ.
- [ ] Các API còn lại theo hợp đồng: danh sách tệp của thành viên, tài liệu chung, xóa (chỉ Admin, xóa luôn trên Cloudinary), link tải có chữ ký và hết hạn ngắn, quota.
- [ ] Cloudinary đặt sau interface `FileStorage`, test dùng bản giả. Listener `MemberDeletedEvent` xóa tệp **sau khi commit**.
- [ ] Quyền upload (#78): User đã liên kết chỉ được `sign`/`confirm` `kind=AVATAR` cho hồ sơ của mình (kiểm `memberId = user.member_id` ở cả hai bước, chỉ jpg/png/webp). `DOCUMENT`, tài liệu chung và xóa tệp chỉ Admin.
- [ ] Test: sai MIME, quá 10 MB, vượt quota, sai folder, User tải avatar của mình được, User tải avatar của người khác hoặc DOCUMENT bị 403, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Tạo tài khoản Cloudinary, điền `CLOUDINARY_*` vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: Admin tải ảnh đại diện cho một cụ, ảnh hiện ở hồ sơ và trên cây.
2. Tải một PDF vào Tài liệu chung: User mở xem được. Thanh quota tăng lên.
3. Xóa tệp: tệp biến mất cả trên Cloudinary.

**➡️ Đợt tiếp:** Đợt 31 — Sự kiện chung và lịch nhắc BE · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 31 — Sự kiện chung và lịch nhắc BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 31, roadmap/IDEA.md §6.5 và §7, docs/DECISIONS.md (#31, #65, #72, #74), .claude/rules/backend.md. Làm bảng custom_event và CRUD (Admin), OccurrenceService (giỗ, sinh nhật, sự kiện chung, eventKey ổn định) phải khớp toàn bộ shared/fixtures/occurrences, API upcoming/month/recent theo hợp đồng. Chỉ làm checklist Đợt 31. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 31 — Sự kiện chung và lịch nhắc BE ⬜
IDEA §6.5, §7 · DECISIONS #31, #65, #72, #74
- [ ] `V11__custom_event.sql`. CRUD `/api/events`: Admin ghi, mọi tài khoản đã duyệt đọc. Kiểm tra lịch, cờ nhuận, ngày/tháng hợp lệ. Ghi audit log. Viết `EventFacade`.
- [ ] `OccurrenceService.between(from, to, types)`: giỗ, sinh nhật và sự kiện chung theo IDEA §6.5 và §7. `eventKey` phải giống bản FE (dùng lại ở Đợt 35).
- [ ] `GET /api/calendar/upcoming`, `/month`, `/recent` theo hợp đồng.
- [ ] Test: `OccurrenceFixturesTest` chạy toàn bộ `shared/fixtures/occurrences/`, phải cho kết quả giống hệt bản TS. Thêm test phân quyền và `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: tab Sắp tới "Cả năm" ra đúng danh sách như ở chế độ giả lập (so vài dòng: Cụ Sửu 11/7, Bà Nhung 29/12).
2. Admin tạo, sửa, xóa sự kiện chung. User không làm được.

**➡️ Đợt tiếp:** Đợt 32 — Dashboard và quản trị BE · Model **Sonnet** · Effort **medium** · Skill: `security-review`, `code-review`
```text
Làm Đợt 32 — Dashboard và quản trị BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 32, roadmap/IDEA.md §6.8 và §6.10, docs/DECISIONS.md (#55, #62, #74), .claude/rules/backend.md và .claude/rules/security.md. Làm GET /api/dashboard, bảng system_setting + API cấu hình (cache Caffeine, dùng cho quota AI, upload, phiên bản chính sách), API thành viên đã xóa đọc snapshot từ audit log. Chỉ làm checklist Đợt 32. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 32 — Dashboard và quản trị BE ⬜
IDEA §6.8, §6.10 · DECISIONS #55, #62, #74
- [ ] `GET /api/dashboard` theo hợp đồng. Số người trên cây và số đời lấy qua `TreeFacade`. Admin có thêm 3 số chờ duyệt (`pendingProposals` bằng 0 cho tới Đợt 33).
- [ ] `V12__system_setting.sql` (key-value), có cache Caffeine. `GET/PUT /api/admin/settings`. Các chỗ đang dùng giá trị cấu hình (phiên bản chính sách, giới hạn upload) chuyển sang đọc từ đây.
- [ ] `GET /api/admin/deleted-members` và `GET /api/admin/deleted-members/{auditId}` đọc snapshot từ `audit_log`.
- [ ] Ghi audit log cho mọi thao tác quản trị.
- [ ] Test: số liệu đúng, User gọi `/api/admin/**` nhận 403, đổi phiên bản chính sách thì `consentRequired=true`, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: Tổng quan hiện Tổng 28 (cộng với số người đã thêm).
2. Admin đổi phiên bản chính sách: đăng nhập lại bằng User thì phải đồng ý lại.
3. Xóa một thành viên thử: Quản trị > Thành viên đã xóa có snapshot.

**➡️ Đợt tiếp:** Đợt 33 — Đề xuất sự kiện BE · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 33 — Đề xuất sự kiện BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 33, roadmap/IDEA.md §6.6, docs/DECISIONS.md (#65, #74, #77), .claude/rules/backend.md. Làm bảng proposal (target_type chỉ EVENT), API theo hợp đồng, duyệt thì áp dụng qua EventFacade trong một transaction, cảnh báo xung đột, phát ProposalReviewed. Chỉ làm checklist Đợt 33. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 33 — Đề xuất sự kiện BE ⬜
IDEA §6.6 · DECISIONS #65, #74, #77
- [ ] `V13__proposal.sql` (`target_type` chỉ có `EVENT`).
- [ ] `POST /api/proposals`:
  - chỉ nhận `targetType=EVENT`, không cần liên kết;
  - server tự tính `diff` và lưu `base_updated_at`;
  - validate payload bằng **cùng validator** với API sự kiện ghi trực tiếp.
- [ ] Các API còn lại theo hợp đồng: `mine`, danh sách chờ, `count`, `approve` (nhận payload đã chỉnh), `reject`.
  - Khi duyệt thì áp dụng qua `EventFacade` trong một transaction và ghi audit log.
  - Báo `conflict: true` khi `updated_at > base_updated_at`.
- [ ] Phát `ProposalReviewed` (để Đợt 34 dùng). Dashboard lấy `pendingProposals` là số thật.
- [ ] Test: `targetType` khác EVENT bị từ chối, duyệt đúng dữ liệu, xung đột, User không duyệt được, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):** Frontend ở chế độ thật, lặp lại các bước 🧪 của Đợt 20, kết quả phải giống ở chế độ giả lập.

**➡️ Đợt tiếp:** Đợt 34 — Thông báo BE: hộp thư, tùy chọn · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 34 — Thông báo BE: hộp thư, tùy chọn theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 34, roadmap/IDEA.md §9, docs/DECISIONS.md (#74), .claude/rules/backend.md. Làm bảng notification và notification_pref, API hộp thư và tùy chọn theo hợp đồng, listener tạo thông báo nghiệp vụ (tài khoản mới chờ duyệt → mọi Admin, được duyệt → user, kết quả liên kết, đề xuất mới → Admin, ProposalReviewed → người đề xuất). Chỉ làm checklist Đợt 34. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 34 — Thông báo BE: hộp thư, tùy chọn ⬜
IDEA §9 · DECISIONS #74
- [ ] `V14__notification.sql`: `notification` và `notification_pref` (giá trị mặc định tạo lười ở lần đọc đầu tiên).
- [ ] API hộp thư và tùy chọn theo hợp đồng. Mỗi người chỉ đọc được thông báo của chính mình.
- [ ] Listener tạo thông báo:
  - tài khoản mới chờ duyệt → mọi Admin;
  - được duyệt → người đó;
  - kết quả liên kết → người yêu cầu;
  - đề xuất mới → mọi Admin;
  - `ProposalReviewed` → người đề xuất.

  Đợt 8 cần phát event cho tài khoản chờ duyệt: nếu chưa có thì thêm ở đợt này.
- [ ] Test: chỉ đọc được của mình, giá trị mặc định, đủ các listener, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng ký user mới: Admin thấy chuông tăng thêm 1, bấm vào thì tới Quản trị > Tài khoản.
2. Admin duyệt user đó: user thấy thông báo "Tài khoản đã được duyệt".

**➡️ Đợt tiếp:** Đợt 35 — Web Push BE · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 35 — Web Push BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 35, roadmap/IDEA.md §9, docs/DECISIONS.md (#46, #74), .claude/rules/backend.md. Làm bảng push_subscription và notification_dispatch, PushSender dùng nl.martijndwars:web-push + VAPID, API push theo hợp đồng, DigestJob mỗi giờ (zone +7) gộp bản tin từ OccurrenceService theo mốc và loại đã bật, chống gửi trùng, xóa subscription khi gặp 404/410. Chỉ làm checklist Đợt 35. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 35 — Web Push BE ⬜
IDEA §9 · DECISIONS #46, #74
- [ ] `V15__push.sql`: `push_subscription` và `notification_dispatch` (UNIQUE trên 4 cột).
- [ ] `PushSender` (interface) và bản cài bằng `nl.martijndwars:web-push` + khóa VAPID. API push theo hợp đồng.
- [ ] `DigestJob` (`@Scheduled` mỗi giờ, zone +7):
  - với tài khoản **đã duyệt** có `send_hour` bằng giờ hiện tại, lấy các lần xảy ra tại những mốc và loại đã bật, gộp thành một bản tin;
  - bản tin rỗng thì không gửi;
  - ghi `notification`, gửi push, và ghi `notification_dispatch` để chống gửi trùng.
- [ ] Gặp 404/410 thì xóa subscription. Gửi thành công thì cập nhật `last_ok_at`.
- [ ] Test: nội dung bản tin ("Còn 3 ngày: Giỗ Cụ Nguyễn Văn Sửu (11/7 âm); …"), mốc bị tắt thì bỏ khỏi bản tin, chạy job 2 lần không gửi trùng, 410 thì xóa, tài khoản chưa duyệt không nhận, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Sinh khóa VAPID (`npx web-push generate-vapid-keys`), điền vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật trên Chrome: bấm "Bật thông báo" rồi "Gửi thử", thông báo hiện ra trên máy.
2. Đặt giờ nhận bằng giờ hiện tại, rồi chạy job bằng tay (endpoint dev hoặc test): nhận được một bản tin gộp.

**➡️ Đợt tiếp:** Đợt 36 — AI BE: provider, tool, SSE, quota · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 36 — AI BE: provider, tool, SSE, quota theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 36, roadmap/IDEA.md §10, docs/DECISIONS.md (#47, #73, #74), .claude/rules/backend.md và .claude/rules/security.md. Làm bảng ai_usage và ai_message, AiProvider + GeminiProvider (com.google.genai, streaming, function calling) + FakeAiProvider, các tool chỉ đọc qua facade với DTO không có SĐT/email, POST /api/ai/chat trả SSE theo hợp đồng, quota 15/30 đọc từ system_setting và reset 0h +7, rate limit. Chỉ làm checklist Đợt 36. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 36 — AI BE: provider, tool, SSE, quota ⬜
IDEA §10 · DECISIONS #47, #73, #74
- [ ] `V16__ai.sql`: `ai_usage` và `ai_message`. Mỗi user có một luồng chat, job dọn tin nhắn cũ hơn 30 ngày.
- [ ] `AiProvider` và `GeminiProvider` (`com.google.genai`, streaming, function calling). `FakeAiProvider` dùng cho profile dev và test.
- [ ] Các tool chỉ đọc (#73), gọi qua facade. DTO riêng cho AI **không có trường SĐT/email**.
- [ ] `POST /api/ai/chat` trả SSE (`token`/`done`/`error`), và ghi lại `ai_message`.
  - Kiểm tra rồi tăng `ai_usage` (15 hoặc 30, đọc từ `system_setting`, reset lúc 0h giờ +7).
  - Có rate limit bằng bucket4j.
  - `GET /api/ai/quota` và `GET /api/ai/messages`.
- [ ] System prompt nêu vai trò và phạm vi (phần từ chối và gợi ý câu hỏi làm ở Đợt 37).
- [ ] Test: DTO của tool không có phone/email (kiểm bằng reflection), hết quota nhận 429, reset theo giờ +7, tài khoản chưa duyệt nhận 403, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Điền `GEMINI_API_KEY` vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật, hỏi "Giỗ Cụ Nguyễn Văn Sửu ngày nào?": chữ hiện dần, trả lời đúng 11/7 âm.
2. Hỏi SĐT của một người: AI không có dữ liệu này.
3. Hỏi đến khi hết lượt: ô nhập bị khóa.

**➡️ Đợt tiếp:** Đợt 37 — AI BE: soạn đề xuất sự kiện, phạm vi · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 37 — AI BE: soạn đề xuất sự kiện, phạm vi theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 37, roadmap/IDEA.md §6.6 và §10, docs/DECISIONS.md (#73, #74, #77), .claude/rules/backend.md và .claude/rules/security.md. Làm tool draftProposal (AiDraft có TTL, chỉ đề xuất sự kiện chung, không ghi dữ liệu gia phả), event SSE draft, submit (User) và apply (Admin) theo hợp đồng, hướng dẫn tự sửa trên hồ sơ khi người dùng muốn sửa hồ sơ/người thân, từ chối câu hỏi ngoài phạm vi kèm 3 câu gợi ý. Chỉ làm checklist Đợt 37. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 37 — AI BE: soạn đề xuất sự kiện, phạm vi ⬜
IDEA §6.6, §10 · DECISIONS #73, #74, #77
- [ ] Tool `draftProposal`: tạo `AiDraft` (lưu tạm, có TTL), **chỉ cho sự kiện chung**, gồm payload và diff tính theo cùng logic của module proposal. SSE gửi event `draft` kèm id. **Không ghi vào dữ liệu gia phả.**
- [ ] `POST /api/ai/drafts/{id}/submit`: User tạo proposal với `source=AI`. `POST /api/ai/drafts/{id}/apply`: Admin tạo và duyệt proposal ngay, có ghi audit log.
- [ ] Người dùng nhờ sửa hồ sơ hoặc người thân: AI không soạn draft, chỉ hướng dẫn tự sửa trên trang hồ sơ (có trong system prompt, có test với Fake).
- [ ] Câu hỏi ngoài phạm vi: từ chối lịch sự và gợi ý 3 câu hỏi mẫu (có trong system prompt, có test với Fake).
- [ ] Test: tool không có đường ghi dữ liệu nào (không gọi facade ghi), chỉ chủ của draft được submit/apply, draft hết hạn, draft cho loại khác sự kiện bị từ chối, `ContractTest`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User nói "Thêm sự kiện họp họ ngày 10 tháng Giêng âm": có thẻ draft, bấm "Gửi đề xuất" thì Admin thấy đề xuất trong hàng đợi.
2. User nói "Sửa tiểu sử của tôi": AI hướng dẫn vào trang hồ sơ để tự sửa, không có thẻ draft.
3. Hỏi chuyện không liên quan: AI từ chối và gợi ý 3 câu.

**➡️ Đợt tiếp:** Đợt 38 — Export BE (Excel, PDF) · Model **Sonnet** · Effort **high** · Skill: `code-review`, `anthropic-skills:xlsx`, `anthropic-skills:pdf`
```text
Làm Đợt 38 — Export BE (Excel, PDF) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 38, roadmap/IDEA.md §6.9, docs/DECISIONS.md (#48, #66, #74), .claude/rules/backend.md. Làm 4 báo cáo theo hợp đồng bằng Apache POI và OpenPDF (nhúng Be Vietnam Pro, A4, có số trang), cột SĐT/email chỉ cho Admin, lịch giỗ nhóm theo tháng âm. Sau đợt này danh sách NOT_YET_IMPLEMENTED của ContractTest phải rỗng. Chỉ làm checklist Đợt 38. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, anthropic-skills:xlsx, anthropic-skills:pdf. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 38 — Export BE (Excel, PDF) ⬜
IDEA §6.9 · DECISIONS #48, #66, #74
- [ ] `GET /api/reports/members.xlsx`: có header, cột ngày dạng date, dòng tiêu đề đông cứng, tự căn độ rộng cột. `GET /api/reports/events.xlsx?year=`.
- [ ] `GET /api/reports/members.pdf` và `GET /api/reports/memorials.pdf?lunarYear=` (nhóm theo tháng âm, kèm ngày dương tương ứng). Nhúng font Be Vietnam Pro, khổ A4, có số trang.
- [ ] Cột SĐT/email chỉ có khi người xuất là Admin. Tên file có ngày xuất.
- [ ] Danh sách `NOT_YET_IMPLEMENTED` của `ContractTest` **rỗng**.
- [ ] Test: đọc lại file xlsx bằng POI để kiểm tra số dòng (28 + số người đã thêm), trích text PDF để kiểm tra chữ có dấu ("Cụ Nguyễn Văn Tham (Tức Cụ Kai)"), User xuất thì không có cột SĐT.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật, trang Xuất dữ liệu: tải đủ 4 file và mở được. Chữ tiếng Việt đúng.
2. Lịch giỗ PDF: tháng 12 âm có Bà Trần Thị Nhung và Nguyễn Văn Thông.

**➡️ Đợt tiếp:** Đợt 39 — Nối FE với BE thật, gỡ lớp giả lập · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `code-review`
```text
Làm Đợt 39 — Nối FE với BE thật, gỡ lớp giả lập theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 39, docs/DECISIONS.md (#70–72), .claude/rules/frontend.md. Chạy toàn bộ app với backend thật, đi hết mọi màn hình ở 375px và 1280px và sửa chỗ lệch; làm công cụ chuyển dữ liệu đã nhập ở chế độ giả lập (file JSON tải từ "Dữ liệu tạm") vào backend qua API; gỡ src/services/mock, dev:mock, VITE_API_MODE và mục Dữ liệu tạm; cập nhật CLAUDE.md và rules bỏ phần giả lập. Trước khi sửa UI, đọc docs/DESIGN.md. Chỉ làm checklist Đợt 39. Xong khi `npm run lint`, `npm run build`, `npm test` và `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN C — NỐI VÀ PHÁT HÀNH

### Đợt 39 — Nối FE với BE thật, gỡ lớp giả lập ⬜
DECISIONS #70–72
- [ ] Chạy frontend với backend thật, đi hết mọi màn hình (bằng tài khoản Admin, User đã liên kết, User chưa liên kết, và tài khoản chờ duyệt) ở khổ 375px và 1280px. Sửa mọi chỗ lệch giữa giả lập và thật (ghi lại danh sách vào ✅ Đã làm).
- [ ] Công cụ **chuyển dữ liệu tạm**: script dev `apps/frontend/scripts/import-mock-data.ts`.
  - Đọc file JSON đã tải ở mục "Dữ liệu tạm", rồi gọi API thật bằng token Admin để tạo lại: thành viên thêm mới hoặc đã sửa, người thân, cây, sự kiện.
  - Có chế độ chạy thử (dry-run) và báo cáo.
  - Không tạo trùng 28 người đã có sẵn trong seed (khớp theo id seed).
- [ ] Gỡ `src/services/mock/`, script `dev:mock`, `VITE_API_MODE`, mục "Dữ liệu tạm" và các banner "Cần kết nối máy chủ". Giữ lại `shared/fixtures/seed/members.json` (nguồn của seed).
- [ ] Cập nhật `CLAUDE.md`, `.claude/rules/frontend.md`, `docs/STRUCTURE.md` và DECISIONS #71 (ghi "đã gỡ ở Đợt 39").

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Nếu đã nhập dữ liệu thật ở chế độ giả lập: vào Thêm > Dữ liệu tạm > "Tải dữ liệu tạm (JSON)" **trước khi** cập nhật lên bản của đợt này.

**🧪 Test thủ công (từng bước):**
1. Chạy script chuyển dữ liệu ở chế độ dry-run, rồi chạy thật: cây và danh sách người thân đã dựng ở chế độ giả lập hiện ra y hệt ở chế độ thật.
2. `npm run build`: không còn mã mock nào.
3. Đi hết các màn hình bằng 4 loại tài khoản: không có lỗi console.

**➡️ Đợt tiếp:** Đợt 40 — E2E Playwright · Model **Sonnet** · Effort **medium** · Skill: `run`, `code-review`
```text
Làm Đợt 40 — E2E Playwright theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 40, docs/DECISIONS.md (#45, #74), .claude/rules/frontend.md và .claude/rules/backend.md. Cài Playwright (project mobile 375px và desktop 1280px), profile e2e cho backend (InMemoryMailSender + endpoint last-otp chỉ có ở e2e, có test chứng minh không có ở prod), viết 3 luồng: đăng ký + OTP + Admin duyệt; Admin thêm thành viên + người thân + dựng cây + gỡ thành ô trống; User liên kết "Tôi là ai", tự sửa hồ sơ và người thân của mình, bị chặn khi sửa nhóm "đã mất". Chỉ làm checklist Đợt 40. Xong khi `npm run e2e` và `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: run, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 40 — E2E Playwright ⬜
DECISIONS #45, #74
- [ ] Cài Playwright với 2 project `mobile` (375px) và `desktop` (1280px).
- [ ] Profile `e2e` của backend: `InMemoryMailSender` và endpoint `GET /api/test/last-otp`, **chỉ bật ở profile e2e**, có test chứng minh endpoint này không tồn tại ở profile prod. `ROOT_ADMIN_EMAIL` riêng cho e2e.
- [ ] 3 luồng:
  1. Đăng ký + OTP, vào trang chờ duyệt, Admin duyệt, người đó vào Tổng quan.
  2. Admin thêm thành viên và người thân, dựng cây (gốc, vợ, con), gỡ một người thành ô trống rồi điền lại.
  3. User liên kết "Tôi là ai", Admin duyệt, User tự sửa tiểu sử và thêm người thân, bị chặn khi sửa nhóm "đã mất".
- [ ] Script `npm run e2e`, hướng dẫn chạy ghi trong README của frontend. Thêm job e2e vào CI (chạy khi có nhãn hoặc chạy hằng đêm).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** `npx playwright install`.

**🧪 Test thủ công (từng bước):** `npm run e2e`: cả 3 luồng đều xanh ở cả 2 project.

**➡️ Đợt tiếp:** Đợt 41 — Deploy production · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 41 — Deploy production theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 41, roadmap/IDEA.md §11, docs/DECISIONS.md (#39–43), .claude/rules/security.md. Làm Dockerfile backend (arm64, không chạy bằng root), nginx build FE, docker-compose.prod.yml (nginx, app, mysql, certbot, có healthcheck), cấu hình nginx (HTTPS, proxy /api, SPA fallback, header bảo mật, forward headers), backup.sh + cron, deploy.yml (workflow_dispatch/tag v*, GHCR, SSH), runbook infra/README.md (có ROOT_ADMIN_EMAIL, seed 28 người chạy lần đầu). Chỉ làm checklist Đợt 41. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 41 — Deploy production ⬜
IDEA §11 · DECISIONS #39–43
- [ ] `apps/backend/Dockerfile` (multi-stage, JRE 21, `linux/arm64`, không chạy bằng root). `infra/nginx/Dockerfile` build frontend rồi copy `dist` vào nginx.
- [ ] `infra/docker-compose.prod.yml`: nginx, app, mysql (có volume, không mở cổng ra ngoài), certbot. Mỗi service có healthcheck.
- [ ] Cấu hình nginx:
  - chuyển HTTP sang HTTPS, `/api` proxy tới app, SPA fallback;
  - gzip, cache dài cho asset có hash, `sw.js` không cache;
  - header HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`.
  - Backend đặt `forward-headers-strategy` để IP của consent và rate limit là IP thật.
- [ ] `infra/backup/backup.sh`: `mysqldump`, gzip, đẩy lên Object Storage, xóa bản cũ hơn 30 ngày. Có mẫu dòng cron.
- [ ] `.github/workflows/deploy.yml`: chạy bằng `workflow_dispatch` hoặc tag `v*`. Build buildx arm64, đẩy GHCR, SSH vào server chạy `docker compose pull && up -d`.
- [ ] `infra/README.md` (runbook): lần deploy đầu (đặt `ROOT_ADMIN_EMAIL`, seed 28 người tự chạy qua Flyway), gia hạn chứng chỉ, khôi phục từ backup.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Tạo VM Oracle ARM, DuckDNS, secrets GitHub (SSH, GHCR), file `.env` prod trên server.

**🧪 Test thủ công (từng bước):**
1. Mở `https://<tên miền>`: có HTTPS, cài được PWA.
2. Đăng ký bằng `ROOT_ADMIN_EMAIL`: thành Admin ngay. Danh sách có 28 thành viên.
3. Chạy `backup.sh` bằng tay: file backup có trên Object Storage.

**➡️ Đợt tiếp:** Hết lộ trình.
