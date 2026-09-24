# ROADMAP — Gia Phả

> Đầu mỗi phiên đọc `CLAUDE.md` và file này. Mỗi phiên **chỉ làm một đợt**, xong thì DỪNG.
> Đặc tả nằm ở `roadmap/IDEA.md`, quyết định kỹ thuật ở `docs/DECISIONS.md` (thắng IDEA khi có mâu thuẫn), giao diện ở `docs/DESIGN.md`.

## Quy tắc
- Mỗi đợt làm **tối đa 1 module**, vừa **một phiên**, và phải có **kết quả chạy được**. Làm BE trước, sau đó nối FE theo từng module.
- **Định nghĩa xong:**
  - BE: `.\mvnw.cmd verify` pass (gồm test Modulith và test truy cập chéo family).
  - FE: `npm run lint` và `npm run build` pass (`npm test` pass nếu có test), đã chạy app và kiểm tra ở khổ 375px và 1280px.
- **Khi xong một đợt:**
  - đổi `- [ ]` thành `- [x]` kèm ngày (ví dụ `- [x] … ✅ 2026-10-02`);
  - đổi ⬜ ở tiêu đề thành `✅ YYYY-MM-DD`;
  - điền mục **✅ Đã làm**, cập nhật 🔧 và 🧪 nếu thực tế khác dự kiến.
- **Model:** mặc định Sonnet. Chỉ dùng Opus cho đợt kiến trúc hoặc đợt khó: lịch âm, cây gia phả, khóa nhánh.
- **Skill bắt buộc theo loại đợt:**

| Loại đợt | Skill |
|---|---|
| BE thường | `code-review` |
| Auth, AI, khóa nhánh, quản trị | `security-review` + `code-review` |
| FE | `ui-ux-pro-max` + `run` |
| Có số liệu hoặc biểu đồ | thêm `dataviz` |
| Export, import | thêm `anthropic-skills:xlsx` và/hoặc `anthropic-skills:pdf` |

## Tiến độ

| Đợt | Tên | Module | Model · Effort | Trạng thái |
|---|---|---|---|---|
| **GĐ1** | **Lõi** | | | |
| 0 | Nền tảng Backend | setup | Sonnet · high | ⬜ |
| 1 | Nền tảng Frontend | setup | Sonnet · high | ⬜ |
| 2 | Auth BE | auth | Sonnet · high | ⬜ |
| 3 | Auth FE | auth | Sonnet · high | ⬜ |
| 4 | Dòng họ BE | family | Sonnet · medium | ⬜ |
| 5 | Dòng họ FE | family | Sonnet · medium | ⬜ |
| 6 | Lịch âm BE | calendar | **Opus · high** | ⬜ |
| 7 | Lịch âm FE | calendar | Sonnet · high | ⬜ |
| 8 | Thành viên BE: cốt lõi | member | Sonnet · high | ⬜ |
| 9 | Thành viên BE: quan hệ, đời, chi | member | Sonnet · high | ⬜ |
| 10 | Upload ảnh BE | file | Sonnet · medium | ⬜ |
| 11 | Thành viên FE: danh sách, chi tiết | member | Sonnet · high | ⬜ |
| 12 | Thành viên FE: form, quan hệ, ảnh | member | Sonnet · high | ⬜ |
| 13 | Liên kết "Tôi là ai" (BE + FE) | family | Sonnet · medium | ⬜ |
| 14 | Cây BE | tree | Sonnet · medium | ⬜ |
| 15 | Cây FE: thuật toán layout | tree | **Opus · high** | ⬜ |
| 16 | Cây FE: hiển thị và thao tác | tree | **Opus · high** | ⬜ |
| 17 | Sự kiện chung BE | event | Sonnet · low | ⬜ |
| 18 | Lịch nhắc BE (occurrences) | calendar | Sonnet · high | ⬜ |
| 19 | Lịch FE | calendar | Sonnet · high | ⬜ |
| 20 | Dashboard (BE + FE) | dashboard | Sonnet · medium | ⬜ |
| 21 | PWA | pwa | Sonnet · medium | ⬜ |
| 22 | E2E Playwright GĐ1 | test | Sonnet · medium | ⬜ |
| 23 | Deploy production GĐ1 | infra | Sonnet · high | ⬜ |
| **GĐ2** | **Tương tác** | | | |
| 24 | Lịch sử thay đổi (BE + FE) | audit | Sonnet · medium | ⬜ |
| 25 | Đề xuất BE | proposal | Sonnet · high | ⬜ |
| 26 | Đề xuất FE | proposal | Sonnet · high | ⬜ |
| 27 | Thông báo BE: hộp thư, tùy chọn | notification | Sonnet · medium | ⬜ |
| 28 | Web Push BE | notification | Sonnet · high | ⬜ |
| 29 | Thông báo FE | notification | Sonnet · high | ⬜ |
| 30 | Đính kèm BE | file | Sonnet · medium | ⬜ |
| 31 | Đính kèm FE | file | Sonnet · medium | ⬜ |
| **GĐ3** | **Nâng cao** | | | |
| 32 | Quản trị BE: user, family, cấu hình | admin | Sonnet · high | ⬜ |
| 33 | Khóa nhánh và xóa member BE | admin | **Opus · high** | ⬜ |
| 34 | Quản trị FE | admin | Sonnet · high | ⬜ |
| 35 | AI BE: provider, tool, SSE, quota | ai | Sonnet · high | ⬜ |
| 36 | AI BE: soạn đề xuất, phạm vi | ai | Sonnet · high | ⬜ |
| 37 | AI FE | ai | Sonnet · high | ⬜ |
| 38 | Export BE (Excel, PDF) | report | Sonnet · high | ⬜ |
| 39 | Export FE và in cây khổ lớn | report | Sonnet · high | ⬜ |
| 40 | Import Excel BE | report | Sonnet · high | ⬜ |
| 41 | Import Excel FE | report | Sonnet · medium | ⬜ |

## ▶️ Bắt đầu: prompt cho Đợt 0
Model **Sonnet** · effort **high** · skill: `code-review`
```text
Làm Đợt 0 — Nền tảng Backend theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 0 trong ROADMAP.md, docs/DECISIONS.md (#1–14, #39–44) và .claude/rules/backend.md. Dựng khung Spring Boot 4.1 + Modulith + Flyway + Testcontainers, docker-compose MySQL 8.4 cho dev, CI backend. Chỉ làm checklist Đợt 0, không làm tính năng. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ ở tiêu đề thành ✅ + ngày, điền mục ✅ Đã làm, cập nhật 🔧/🧪 nếu khác dự kiến, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN 1 — LÕI

### Đợt 0 — Nền tảng Backend ⬜
IDEA §11 · DECISIONS #1–14, #39–44
- [ ] `apps/backend`: dự án Maven, dùng Maven Wrapper, Java 21, Spring Boot 4.1.x (cố định bản patch). Các dependency: web, security, oauth2-resource-server, data-jpa, validation, flyway + flyway-mysql, mysql-connector-j, actuator, spring-modulith, mapstruct, springdoc 3.x, caffeine, bucket4j, testcontainers-mysql.
- [ ] Package `vn.giapha`, tạo 13 module rỗng (`auth family member tree calendar event proposal notification file ai report admin common`), mỗi module có `package-info.java`.
- [ ] `application.yml`, `application-dev.yml`, `application-prod.yml`, mọi bí mật đọc từ biến môi trường. JVM chạy UTC. Tạo `apps/backend/.env.example` liệt kê đủ các khóa (IDEA §11).
- [ ] `infra/docker-compose.dev.yml`: MySQL 8.4, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`, có volume.
- [ ] `V1__audit_log.sql` + module `common`: `AuditLogWriter`, `BusinessException`, `GlobalExceptionHandler` trả `ProblemDetail` kèm `errors[]`.
- [ ] `SecurityConfig` tạm: stateless, mở `/actuator/health`, `/v3/api-docs/**`, `/swagger-ui/**`, mọi đường dẫn khác bắt buộc đăng nhập.
- [ ] Test: `ModularityTests` (verify), `ApplicationSmokeTest` (Testcontainers, Flyway chạy được), test `GlobalExceptionHandler`.
- [ ] `.github/workflows/ci.yml` có job `backend` (JDK 21, `./mvnw verify`). `.gitignore` gốc (`.env`, `target`, `node_modules`, `dist`).
- [ ] Bố cục package theo `docs/STRUCTURE.md` §3 (thêm `config/`, `common/{audit,security,exception,consent,web,util}`).
- [ ] `.claude/` theo `docs/STRUCTURE.md` §2: `settings.json` (hook chặn ghi `.env*` và file Flyway V đã có, nhắc đọc ROADMAP), 4 skill (`dot-close`, `be-slice`, `fe-feature`, `flyway-migration`), 3 agent (`code-reviewer`, `test-writer`, `security-reviewer`), và `.mcp.json` (playwright, mysql-dev chỉ đọc). Ghi `.claude/settings.local.json` vào `.gitignore`.

**✅ Đã làm:** _(điền khi xong: ngày, tóm tắt, file chính)_

**🔧 Setup thủ công cần làm:**
- Cài JDK 21 và Docker Desktop (bật WSL2).
- Copy `apps/backend/.env.example` thành `apps/backend/.env`, điền `DB_PASSWORD` và `JWT_SECRET` (≥ 32 byte ngẫu nhiên).

**🧪 Test thủ công (từng bước):**
1. `docker compose -f infra/docker-compose.dev.yml up -d`, rồi kiểm tra container MySQL đang `healthy`.
2. Trong `apps/backend`, chạy `.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev`.
3. Mở `http://localhost:8080/actuator/health`, kết quả phải là `{"status":"UP"}`.
4. Mở `http://localhost:8080/swagger-ui.html`, trang phải hiện ra.
5. Mở `http://localhost:8080/api/abc`, kết quả phải là 401.
6. Chạy `.\mvnw.cmd verify`, toàn bộ phải xanh.

**➡️ Đợt tiếp:** Đợt 1 — Nền tảng Frontend · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 1 — Nền tảng Frontend theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 1 trong ROADMAP.md, docs/DECISIONS.md (#4, #14, #36–38), .claude/rules/frontend.md. Dựng Vite + React 19 + TS + Tailwind 4 + shadcn/ui, token theo DESIGN.md, AppShell (sidebar/rail/bottom nav), api client, gen:api, Vitest, CI frontend. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 1. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 1 — Nền tảng Frontend ⬜
DECISIONS #4, #14, #36–38 · DESIGN toàn bộ
- [ ] `apps/frontend`: Vite + React 19 + TypeScript strict, ESLint (flat config) + Prettier, alias `@/`.
- [ ] Tailwind 4 + shadcn/ui. Đưa token từ `docs/DESIGN.md` vào `src/styles/index.css` (`@theme` + các biến của shadcn), font Be Vietnam Pro, icon lucide.
- [ ] Bố cục thư mục theo `docs/STRUCTURE.md` §4 (`assets, components/{ui,shared}, layout, pages, features, hooks, context, services, utils, types`, không có `redux`).
- [ ] React Router 7 + `layout/AppShell`: Sidebar (≥1024px), rail 72px (768–1023px), BottomNav 5 mục (<768px), Header. Có trang tạm cho: Tổng quan, Cây, Thành viên, Lịch, Thêm, và trang 404.
- [ ] `src/services/client.ts` (wrapper của fetch, base `/api`, parse `ProblemDetail` thành `ApiError`), `QueryClientProvider`, Vite proxy `/api` sang `:8080`.
- [ ] Script `gen:api` (openapi-typescript) và chạy một lần để sinh `src/services/schema.d.ts`.
- [ ] Vitest + Testing Library, kèm một test cho BottomNav/AppShell.
- [ ] `ci.yml` có thêm job `frontend`: `npm ci`, `lint`, `build`, `test`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Cài Node 24 LTS.

**🧪 Test thủ công (từng bước):**
1. Chạy backend (Đợt 0). Trong `apps/frontend`, chạy `npm install` rồi `npm run dev`.
2. Mở `http://localhost:5173` ở khổ 1280px: phải thấy sidebar trắng và mục đang chọn có nền navy.
3. Thu về 900px: sidebar phải chỉ còn icon.
4. Thu về 375px: phải hiện thanh điều hướng dưới với 5 mục, chữ không nhỏ hơn 16px.
5. Bấm từng mục: URL đổi và trang tạm hiện ra. Vào `/abc` phải thấy trang 404.
6. Chạy `npm run gen:api`: file `src/services/schema.d.ts` phải được tạo.

**➡️ Đợt tiếp:** Đợt 2 — Auth BE · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 2 — Auth BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 2 trong ROADMAP.md, roadmap/IDEA.md §6.1, docs/DECISIONS.md (#15–21), .claude/rules/backend.md và .claude/rules/security.md. Làm đăng ký + OTP, đăng nhập, JWT + refresh cookie xoay vòng, Google ID token, quên mật khẩu, khóa 15 phút, MailSender (Console cho dev). Chỉ làm checklist Đợt 2. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 2 — Auth BE ⬜
IDEA §6.1 · DECISIONS #15–21
- [ ] `V2__auth.sql`: `user_account`, `email_otp`, `refresh_token` (theo IDEA §4).
- [ ] `MailSender` + `ConsoleMailSender` (profile dev) + `SmtpMailSender` (dùng `MAIL_*`).
- [ ] Đăng ký tạo tài khoản PENDING và gửi OTP (hiệu lực 10 phút, sai tối đa 5 lần, 60 giây mới được gửi lại). Xác thực OTP thì chuyển ACTIVE và đăng nhập luôn.
- [ ] Đăng nhập bằng email/mật khẩu, lỗi chỉ báo chung. Sai 5 lần thì khóa 15 phút theo email (Caffeine + bucket4j). Rate limit cho gửi OTP.
- [ ] Phát JWT HS256 hiệu lực 15 phút (claim: `sub`, `sysRole`, `familyId`, `familyRole`, `memberId`). Refresh token 30 ngày trong cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, xoay vòng sau mỗi lần refresh, DB chỉ lưu SHA-256. Có `logout`.
- [ ] `POST /api/auth/google`: xác minh ID token (aud, iss, exp), tự liên kết theo email (#16).
- [ ] Quên mật khẩu: OTP RESET, đặt mật khẩu mới, thu hồi mọi refresh token.
- [ ] `GET /api/me` và helper `CurrentUser`. Job hằng ngày xóa tài khoản PENDING quá 7 ngày.
- [ ] Test: đăng ký rồi xác thực, OTP sai 5 lần, khóa đăng nhập, xoay vòng và thu hồi refresh token, đặt lại mật khẩu, response không chứa `passwordHash`, Google (mock bộ xác minh token).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Google Cloud Console: tạo OAuth Client ID loại *Web*, thêm origin `http://localhost:5173`, rồi điền `GOOGLE_CLIENT_ID` vào `.env`.
- Đảm bảo `JWT_SECRET` dài ≥ 32 byte.

**🧪 Test thủ công (từng bước):**
1. Chạy backend ở profile dev, mở Swagger.
2. `POST /api/auth/register` với email mới, lấy OTP 6 số trong log console.
3. `POST /api/auth/verify-otp`: nhận `accessToken`, và tab Network phải có header `Set-Cookie` HttpOnly.
4. `GET /api/me` kèm Bearer token: phải thấy thông tin user và không có trường hash nào.
5. Đăng nhập sai mật khẩu 5 lần: lần thứ 6 báo bị khóa, dù có nhập đúng mật khẩu.
6. `POST /api/auth/refresh`: nhận token mới, dùng lại cookie cũ phải bị từ chối.
7. Quên mật khẩu, nhập OTP trong log, đặt mật khẩu mới. Refresh token cũ phải không còn dùng được.

**➡️ Đợt tiếp:** Đợt 3 — Auth FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `security-review`, `code-review`
```text
Làm Đợt 3 — Auth FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 3, roadmap/IDEA.md §6.1, docs/DECISIONS.md (#15–17), .claude/rules/frontend.md và .claude/rules/security.md. Làm các trang đăng nhập/đăng ký/OTP/quên mật khẩu, nút Google, AuthProvider giữ token trong bộ nhớ, tự refresh khi gặp 401, route guard. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 3. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 3 — Auth FE ⬜
IDEA §6.1 · DECISIONS #15–17
- [ ] Các trang: Đăng nhập, Đăng ký (có tick đồng ý điều khoản), Nhập OTP (đếm ngược 60 giây mới gửi lại được), Quên mật khẩu, rồi OTP, rồi Mật khẩu mới.
- [ ] Nút "Đăng nhập với Google" dùng Google Identity Services, gọi `/api/auth/google`.
- [ ] `AuthProvider`: access token chỉ giữ trong bộ nhớ. Khi tải trang thì gọi `/auth/refresh`. `client.ts` gắn Bearer, gặp 401 thì refresh một lần rồi thử lại. Có đăng xuất.
- [ ] Route guard và điều hướng sau đăng nhập: chưa có family vào `/bat-dau` (trang tạm), có family vào `/`, Admin vào `/quan-tri` (trang tạm).
- [ ] Lỗi trong `ProblemDetail.errors` hiện đúng dưới từng trường (RHF + Zod).
- [ ] Test Vitest cho schema Zod của form đăng ký.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Tạo `apps/frontend/.env.local` với `VITE_GOOGLE_CLIENT_ID=<cùng client id ở Đợt 2>`.

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

### Đợt 4 — Dòng họ BE ⬜
IDEA §3, §6.2 · DECISIONS #22–24
- [ ] `V3__family.sql`: `family`, `family_invitation` (thêm `revoked_at`), `user_consent`. Phiên bản chính sách lấy từ cấu hình `app.policy.version`.
- [ ] Tạo family (chỉ cho user chưa có family), người tạo thành Manager, lưu consent.
- [ ] Mã mời: tạo (chuỗi ngẫu nhiên 8 ký tự + link), xem danh sách, thu hồi. Tham gia bằng mã (lưu consent) thì vào thẳng family. Báo lỗi riêng khi mã hết hạn hoặc đã bị thu hồi.
- [ ] Rời family (User), loại thành viên (Manager), chuyển quyền Manager. Manager chỉ rời được sau khi đã chuyển quyền. Mỗi thay đổi đều thu hồi refresh token của người bị ảnh hưởng.
- [ ] `GET /api/family`: thông tin family và danh sách tài khoản. Email chỉ hiện cho Manager và chính chủ.
- [ ] Facade `FamilyFacade`, để module khác đọc `familyId` và vai trò.
- [ ] Test: mã hết hạn hoặc bị thu hồi, user đã có family không tham gia được family khác, chuyển quyền, truy cập chéo family trả 404.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User A tạo family qua Swagger, gọi `/api/me` thì phải thấy `familyRole=MANAGER`.
2. A tạo mã mời. User B tham gia bằng mã đó, gọi `/api/family` thì phải thấy 2 tài khoản.
3. A thu hồi mã. User C dùng lại mã đó phải bị báo lỗi.
4. A thử rời family: bị chặn. A chuyển quyền cho B rồi rời: thành công.
5. Dùng token của family khác gọi `/api/family/{id}`: nhận 404.

**➡️ Đợt tiếp:** Đợt 5 — Dòng họ FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 5 — Dòng họ FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 5, roadmap/IDEA.md §6.2, docs/DECISIONS.md (#22–24), .claude/rules/frontend.md. Làm màn hình onboarding "Tạo dòng họ / Nhập mã mời" có consent, trang Chính sách bảo mật, mở link mời, trang Dòng họ (mã mời, chia sẻ, chuyển quyền, loại, rời). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 5. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 5 — Dòng họ FE ⬜
IDEA §6.2 · DECISIONS #22–24
- [ ] `/bat-dau`: hai lựa chọn "Tạo dòng họ" (tên, quê quán, mô tả) và "Nhập mã mời". Cả hai đều bắt tick đồng ý, có link tới trang chính sách.
- [ ] `/chinh-sach-bao-mat`: trang tĩnh ghi đủ 5 ý ở IDEA §6.2, có hiện phiên bản chính sách.
- [ ] `/moi/:code`: nếu chưa đăng nhập thì chuyển qua đăng nhập/đăng ký rồi quay lại để tham gia.
- [ ] Trang "Dòng họ" (trong menu Thêm): thông tin, danh sách tài khoản. Manager có thêm: tạo mã, "Chia sẻ" (Web Share API, không hỗ trợ thì sao chép link), thu hồi, chuyển quyền, loại thành viên. Mọi người đều có nút "Rời dòng họ".
- [ ] Sau khi tham gia, rời, hoặc chuyển quyền thì gọi refresh để cập nhật claim trong token.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng ký user mới: phải vào `/bat-dau`. Tạo dòng họ mà không tick đồng ý: bị chặn. Tick rồi tạo: vào Dashboard.
2. Vào trang Dòng họ, tạo mã, bấm Chia sẻ: trên máy tính link được sao chép.
3. Mở cửa sổ ẩn danh, dán link, đăng ký user B: B tự vào family.
4. Manager chuyển quyền cho B: menu của A mất các mục quản lý.
5. Kiểm tra mọi màn hình ở khổ 375px.

**➡️ Đợt tiếp:** Đợt 6 — Lịch âm BE · Model **Opus** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 6 — Lịch âm BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 6, roadmap/IDEA.md §7, docs/DECISIONS.md (#11, #30, #31, #35), .claude/rules/backend.md. Cài thuật toán Hồ Ngọc Đức (UTC+7) trong module calendar, thêm quy tắc ngày giỗ/sinh nhật/sự kiện âm, và bộ đối chiếu 1900–2100 ở shared/fixtures/lunar lấy từ nguồn độc lập (không sinh từ chính code đang test). Chỉ làm checklist Đợt 6. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 6 — Lịch âm BE ⬜
IDEA §7 · DECISIONS #11, #30, #31, #35
- [ ] `calendar`: lớp `LunarCalendar` theo thuật toán Hồ Ngọc Đức, TZ +7. Làm các phép đổi dương sang âm, âm sang dương (có cờ nhuận), số ngày của tháng âm (29/30), tháng nhuận của năm.
- [ ] `AnniversaryRules`: xác định ngày giỗ trong năm âm Y. Thứ tự ưu tiên: ngày ghi đè, rồi tháng nhuận cúng tháng thường, rồi ngày 30 cúng 29. Sinh nhật âm và sự kiện âm dùng cùng quy tắc. Sinh nhật dương 29/2 dời sang 28/2.
- [ ] `shared/fixtures/lunar/`: file JSON đối chiếu gồm mùng 1 Tết 1900–2100, các tháng nhuận, và các ngày mẫu. **Lấy từ nguồn độc lập** (bảng của Hồ Ngọc Đức hoặc lịch chính thức), ghi nguồn vào `README.md`.
- [ ] Facade `CalendarFacade` và API: `GET /api/calendar/convert` (hai chiều), `GET /api/calendar/lunar-month-info`.
- [ ] Test: toàn bộ fixture, Tết 1985 là **21/01/1985** (lịch Việt Nam, khác Trung Quốc), các năm nhuận 2020 (tháng 4), 2023 (tháng 2), 2025 (tháng 6), đủ các nhánh của `AnniversaryRules`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Swagger, `GET /api/calendar/convert?solar=2026-02-17`: kết quả là 1/1 âm (Tết Bính Ngọ).
2. `?solar=2025-01-29`: kết quả 1/1 âm.
3. `?solar=1985-01-21`: kết quả 1/1 âm.
4. Đổi ngược một ngày thuộc tháng 6 nhuận năm 2025, rồi đổi lại: phải ra đúng ngày ban đầu.
5. Chạy `.\mvnw.cmd test -Dtest=*Lunar*`: toàn bộ xanh.

**➡️ Đợt tiếp:** Đợt 7 — Lịch âm FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 7 — Lịch âm FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 7, roadmap/IDEA.md §7, docs/DECISIONS.md (#35), .claude/rules/frontend.md. Port LunarCalendar và AnniversaryRules sang TS ở src/utils/lunar, chạy chung fixture shared/fixtures/lunar, làm component DualDateInput và trang "Đổi lịch âm–dương". Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 7. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 7 — Lịch âm FE ⬜
IDEA §7 · DECISIONS #35
- [ ] `src/utils/lunar/`: bản TS của `LunarCalendar` và `AnniversaryRules`, API giống bản Java.
- [ ] Vitest chạy **cùng** fixture `shared/fixtures/lunar/` với Java.
- [ ] Component `DualDateInput` (`components/ui`): chọn nhập theo Âm hoặc Dương, hiện ngày tương ứng ở lịch còn lại, có cờ nhuận, cho phép nhập "chỉ năm" hoặc "chỉ ngày/tháng âm".
- [ ] Trang "Đổi lịch âm–dương" trong menu Thêm, dùng `DualDateInput`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở trang Đổi lịch, nhập dương 17/02/2026: phải hiện 1/1 âm.
2. Chuyển sang nhập âm 15/6 nhuận năm 2025: phải hiện đúng ngày dương, khớp với API `/api/calendar/convert`.
3. Nhập âm 30/12 của một năm có tháng 12 thiếu: phải hiện cảnh báo rằng ngày không tồn tại.
4. Ở khổ 375px, dùng bàn phím Tab qua các ô: focus ring phải nhìn thấy rõ.

**➡️ Đợt tiếp:** Đợt 8 — Thành viên BE: cốt lõi · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 8 — Thành viên BE: cốt lõi theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 8, roadmap/IDEA.md §4 và §6.3, docs/DECISIONS.md (#9, #25, #30, #31), .claude/rules/backend.md. Tạo bảng member + branch (đủ cột locked), CRUD member, danh sách có lọc/sắp xếp/tìm không dấu, ẩn SĐT/email theo quyền, ghi audit log. Chỉ làm checklist Đợt 8. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 8 — Thành viên BE: cốt lõi ⬜
IDEA §4, §6.3 · DECISIONS #9, #25, #30, #31
- [ ] `V4__member.sql`: `branch`, `member`. Bảng `member` có đủ cột theo IDEA, thêm `birth_lunar_leap`, `search_name`, và **đầy đủ các cột locked**. Tạo index `(family_id, locked)` và `(family_id, search_name)`.
- [ ] CRUD member (chỉ Manager/Admin), không có xóa. Chỉ `full_name` là bắt buộc. Các trường về cái chết chỉ hợp lệ khi `is_deceased`. Nhập ngày mất theo một lịch thì tự điền lịch còn lại qua `CalendarFacade`, trừ trường hợp không có năm (#31).
- [ ] `GET /api/members`: phân trang. Sắp xếp theo tên, tuổi, thời gian thêm, chi, đời. Lọc theo tên không dấu, khoảng tuổi, chi, đời, sống/mất. Luôn kèm `locked = false`.
- [ ] `GET /api/members/{id}`. SĐT và email chỉ trả cho Admin, Manager hoặc chính chủ (`user.member_id`).
- [ ] Ghi `AuditLogWriter` khi tạo hoặc sửa. Viết facade `MemberFacade`.
- [ ] Test: tìm "dang van" ra "Đặng Văn…", ẩn SĐT/email với User, truy cập chéo family trả 404, member bị khóa không xuất hiện.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dùng tài khoản Manager, tạo 3 member qua Swagger. Một người đã mất, ngày mất nhập âm.
2. Gọi `GET /api/members?q=dang`: có kết quả dù tên trong DB có dấu.
3. Đăng nhập bằng User, xem chi tiết người có SĐT: không thấy SĐT.
4. Trong MySQL, đặt `locked=1` cho một người: người đó biến mất khỏi danh sách.
5. Xem bảng `audit_log`: có bản ghi `before`/`after`.

**➡️ Đợt tiếp:** Đợt 9 — Thành viên BE: quan hệ, đời, chi · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 9 — Thành viên BE: quan hệ, đời, chi theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 9, roadmap/IDEA.md §4 và §8, docs/DECISIONS.md (#26–28, #32), .claude/rules/backend.md. Làm bảng marriage (có husband_order), gán cha mẹ, thêm con/vợ chồng/cha mẹ, tính lại đời theo từng cây rời, tự suy lineage, tự gán chi, API người thân. Chỉ làm checklist Đợt 9. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 9 — Thành viên BE: quan hệ, đời, chi ⬜
IDEA §4, §8 · DECISIONS #26–28, #32
- [ ] `V5__marriage.sql`: `marriage`, thêm cột `husband_order`.
- [ ] Các thao tác: "+ Con" (theo một cặp cha–mẹ, có `child_type`, `birth_order`), "+ Vợ/Chồng" (lineage DAU_RE, cùng đời), "+ Cha/Mẹ". Kiểm tra: không tạo vòng quan hệ, cha là nam, mẹ là nữ, cả hai cùng family.
- [ ] `GenerationService`: tính lại đời theo từng cây rời, Đời 01 là người cao nhất, dâu/rể cùng đời với vợ/chồng. Thêm tổ tiên thì đánh số lại (#28).
- [ ] Tự suy `lineage` (#27), Manager sửa tay được. CRUD `branch`, đặt `root_member_id` thì tự gán chi cho con cháu (#32).
- [ ] `GET /api/members/{id}/relatives`: cha mẹ, vợ/chồng (theo thứ tự), con theo từng cặp, anh chị em (suy ra, ghi rõ cùng cha khác mẹ nếu có).
- [ ] Test: đánh số lại đời, nhiều vợ và nhiều chồng, NGOAI truyền xuống, chống vòng, anh em cùng cha khác mẹ, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tạo ông A, thêm vợ Cả B và vợ Hai C. Thêm con D (A+B) và con E (A+C).
2. `GET /api/members/D/relatives`: E là anh em cùng cha khác mẹ.
3. Thêm cha F cho A: F thành Đời 01, A thành Đời 02, D thành Đời 03.
4. Thêm con gái G cho A, rồi thêm con H cho G: lineage của H là NGOAI.
5. Gán A làm gốc của chi "Chi 1": D, E, G, H đều có `branch_id` = Chi 1.

**➡️ Đợt tiếp:** Đợt 10 — Upload ảnh BE · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 10 — Upload ảnh BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 10, roadmap/IDEA.md §6.7, docs/DECISIONS.md (#33c), .claude/rules/backend.md và .claude/rules/security.md. Làm module file: bảng attachment có cột kind, cấp chữ ký Cloudinary, xác nhận upload, kiểm tra MIME/10 MB/quota 1 GB, cập nhật avatar_url/cover_url. Chỉ làm checklist Đợt 10. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 10 — Upload ảnh BE ⬜
IDEA §6.7 · DECISIONS #33c
- [ ] `V6__attachment.sql`: `attachment`, thêm cột `kind` (AVATAR, COVER, DOCUMENT).
- [ ] `POST /api/files/sign`: cấp chữ ký upload Cloudinary, folder `family/{familyId}`. Kiểm tra quota trước khi cấp.
- [ ] `POST /api/files/confirm`: dùng Cloudinary Admin API để xác minh `public_id` (định dạng, kích thước ≤ 10 MB, đúng folder), rồi lưu `attachment`. Nếu là AVATAR hoặc COVER thì cập nhật `member.avatar_url` hoặc `family.cover_url`, và xóa file cũ.
- [ ] `GET /api/files/quota` trả dung lượng đã dùng / 1 GB.
- [ ] Cloudinary đặt sau interface `FileStorage`, test dùng bản giả.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Tạo tài khoản Cloudinary (gói miễn phí), điền `CLOUDINARY_URL` vào `.env`.

**🧪 Test thủ công (từng bước):**
1. Gọi `POST /api/files/sign` với `kind=AVATAR`, `memberId`.
2. Upload một ảnh bằng curl lên Cloudinary theo chữ ký vừa nhận.
3. Gọi `POST /api/files/confirm`: `avatar_url` của member được cập nhật.
4. Thử confirm một file PDF 12 MB: bị từ chối.
5. Gọi `GET /api/files/quota`: dung lượng đã dùng tăng lên.

**➡️ Đợt tiếp:** Đợt 11 — Thành viên FE: danh sách, chi tiết · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 11 — Thành viên FE: danh sách, chi tiết theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 11, roadmap/IDEA.md §6.3, .claude/rules/frontend.md. Chạy npm run gen:api trước. Làm trang danh sách (bảng trên máy tính, thẻ trên điện thoại, lọc/sắp xếp/tìm không dấu) và trang chi tiết (thẻ hồ sơ navy theo DESIGN.md, quan hệ). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 11. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 11 — Thành viên FE: danh sách, chi tiết ⬜
IDEA §6.3 · DESIGN §5
- [ ] `features/member`: `api.ts`, `hooks.ts` (TanStack Query, lưu tham số lọc trên URL).
- [ ] Danh sách: bảng trên máy tính, thẻ trên điện thoại. Sắp xếp theo 5 tiêu chí. Lọc theo tên (không dấu), khoảng tuổi, chi, đời, sống/mất. Có trạng thái rỗng và skeleton khi tải.
- [ ] Trang chi tiết: thẻ hồ sơ navy (avatar, badge sống/mất, năm sinh – năm mất, đời, nhãn), các ô liên hệ (chỉ hiện khi API có trả), khối quan hệ (cha mẹ, vợ/chồng, con theo cặp, anh chị em), mỗi người là một link.
- [ ] Để tab trống cho "Tệp đính kèm" và "Lịch sử" (làm ở GĐ2).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có. Cần dữ liệu mẫu từ Đợt 9.

**🧪 Test thủ công (từng bước):**
1. Ở khổ 1280px, mở Thành viên: hiện dạng bảng. Sắp xếp theo đời và lọc "đã mất".
2. Gõ "dang" vào ô tìm: có kết quả. F5: bộ lọc vẫn giữ nguyên.
3. Ở khổ 375px: hiện dạng thẻ, lọc mở bằng sheet.
4. Mở chi tiết D: thấy cha mẹ, anh em khác mẹ E. Bấm vào E thì chuyển sang trang của E.
5. Đăng nhập bằng User: không thấy SĐT của người khác.

**➡️ Đợt tiếp:** Đợt 12 — Thành viên FE: form, quan hệ, ảnh · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 12 — Thành viên FE: form, quan hệ, ảnh theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 12, roadmap/IDEA.md §6.3, docs/DECISIONS.md (#27, #30–33), .claude/rules/frontend.md. Làm form thêm/sửa member (dùng DualDateInput), các dialog + Con/+ Vợ-Chồng/+ Cha-Mẹ để dùng lại ở trang cây, quản lý chi, upload avatar lên Cloudinary bằng chữ ký. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 12. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 12 — Thành viên FE: form, quan hệ, ảnh ⬜
IDEA §6.3 · DECISIONS #27, #30–33
- [ ] `MemberForm` (RHF + Zod): chỉ họ tên bắt buộc. Khối "Đã qua đời" chỉ hiện khi được chọn. Ngày sinh và ngày mất dùng `DualDateInput`. Chọn sinh nhật Dương hoặc Âm. Có nhãn, tiểu sử, `prefix_override`, `lineage`, chi.
- [ ] Các dialog `AddChildDialog`, `AddSpouseDialog`, `AddParentDialog`, đặt trong `features/member/components`, dùng lại được ở Đợt 16.
- [ ] Trang quản lý Chi: CRUD, chọn người gốc.
- [ ] `AvatarUpload`: xin chữ ký, upload thẳng lên Cloudinary, gọi confirm. Có preview và báo lỗi kích thước/định dạng. Ảnh bìa family cũng dùng component này.
- [ ] Chỉ Manager và Admin thấy các nút sửa/thêm (#33a).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có (Cloudinary đã cấu hình ở Đợt 10).

**🧪 Test thủ công (từng bước):**
1. Thêm member chỉ nhập họ tên: lưu được.
2. Tick "Đã qua đời", nhập ngày mất theo âm: ngày dương tự điền.
3. Trên trang A, bấm "+ Vợ/Chồng", rồi "+ Con" chọn đúng cặp: trang chi tiết hiện đúng quan hệ.
4. Upload avatar 2 MB: ảnh hiện ngay. Upload file 12 MB: báo lỗi.
5. Đăng nhập bằng User: không thấy nút sửa hay thêm nào.

**➡️ Đợt tiếp:** Đợt 13 — Liên kết "Tôi là ai" · Model **Sonnet** · Effort **medium** · Skill: `code-review`, `ui-ux-pro-max`, `run`
```text
Làm Đợt 13 — Liên kết "Tôi là ai" (BE rồi FE) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 13, roadmap/IDEA.md §6.2, .claude/rules/backend.md và .claude/rules/frontend.md. BE: bảng member_link_request, gửi/duyệt/từ chối, mỗi member chỉ liên kết tối đa 1 tài khoản. FE: bước chọn "Tôi là ai" sau khi tham gia, trang duyệt cho Manager. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 13. Xong khi `.\mvnw.cmd verify`, `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 13 — Liên kết "Tôi là ai" (BE + FE) ⬜
IDEA §6.2
- [ ] BE `V7__member_link_request.sql` (thêm `family_id`, `created_at`). User gửi yêu cầu. Manager xem danh sách chờ, duyệt thì gán `user.member_id` và làm mới claim. Không cho liên kết member đã có tài khoản, hoặc member đang bị khóa. Có hủy liên kết.
- [ ] BE test: một member chỉ liên kết một tài khoản, truy cập chéo family, chỉ Manager được duyệt.
- [ ] FE: sau khi tham gia (và trong menu Thêm), user tìm member qua ô tìm không dấu, rồi "Đây là tôi" để gửi yêu cầu. Có hiện trạng thái đang chờ.
- [ ] FE: trang "Yêu cầu liên kết" của Manager có số đang chờ, duyệt và từ chối.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User B chọn "Đây là tôi" cho member D: hiện "Đang chờ duyệt".
2. Manager mở Yêu cầu liên kết, duyệt.
3. B tải lại trang: thấy SĐT và email của chính mình (D).
4. User C gửi yêu cầu liên kết với D: bị báo đã có người liên kết.

**➡️ Đợt tiếp:** Đợt 14 — Cây BE · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 14 — Cây BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 14, roadmap/IDEA.md §8, docs/DECISIONS.md (#29, #34), .claude/rules/backend.md. Làm module tree: API trả đồ thị (nút + cạnh, không có toạ độ), tính tiền tố Cụ/Ông/Bà theo người xem, lưu lựa chọn "Ẩn dòng ngoại", API tổ tiên của tôi. Chỉ làm checklist Đợt 14. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 14 — Cây BE ⬜
IDEA §8 · DECISIONS #29, #34
- [ ] `GET /api/tree?rootId=&hideMaternal=`: trả `nodes` (id, tên, tiền tố, giới tính, năm sinh – năm mất, đã mất, nhãn, avatar, đời, lineage, `birth_order`) và `edges` (hôn nhân kèm thứ tự, cặp cha–mẹ → con). Loại bỏ member bị khóa.
- [ ] Tải toàn bộ member của family trong một lần truy vấn, rồi dựng đồ thị trong bộ nhớ. Test với 500 người phải chạy dưới 300 ms.
- [ ] Tiền tố theo #29, tính từ `user.member_id` của người xem. Chưa liên kết thì không có tiền tố, trừ khi có `prefix_override`.
- [ ] `GET /api/tree/ancestors?memberId=` ("Xem tổ tiên của tôi"). `PUT /api/me/preferences` để lưu `hide_maternal_line`.
- [ ] Test: tiền tố (đời cao hơn, thấp hơn, chưa liên kết, override), hideMaternal, member bị khóa không có trong đồ thị, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng nhập bằng user đã liên kết với D (Đời 03). Gọi `GET /api/tree`: F (Đời 01) có tiền tố "Ông", còn con của D không có tiền tố.
2. Gọi với `hideMaternal=true`: không còn con rể của G, cũng không còn H.
3. Gọi `/api/tree/ancestors?memberId=D`: chỉ có A, B, F (và vợ của F nếu có).

**➡️ Đợt tiếp:** Đợt 15 — Cây FE: thuật toán layout · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 15 — Cây FE: thuật toán layout theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 15, roadmap/IDEA.md §8, docs/DECISIONS.md (#26, #28, #34), .claude/rules/frontend.md. Viết hàm thuần layoutTree(graph, options) ở features/tree/layout: mỗi đời một hàng, đơn vị xếp là cặp vợ chồng, nhiều vợ/chồng xếp hai bên theo thứ tự, con đi xuống từ đúng cặp cha–mẹ, không chồng lấn, hỗ trợ thu gọn và nhiều cây rời. Có Vitest và trang /dev/cay vẽ SVG để kiểm tra bằng mắt. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 15. Xong khi `npm run lint`, `npm run build` và `npm test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 15 — Cây FE: thuật toán layout ⬜
IDEA §8 · DECISIONS #26, #28, #34
- [ ] `features/tree/layout/layoutTree.ts`: hàm thuần, kết quả xác định (cùng đầu vào cho cùng kết quả). Đầu vào là đồ thị từ Đợt 14 và options (`collapsedIds`, `hideMaternal`, `rootId`, `maxDepth`). Đầu ra gồm toạ độ nút, đường nối, và `y` của từng hàng đời.
- [ ] Quy tắc: mỗi đời một hàng. Đơn vị xếp là cặp vợ chồng, chồng ở giữa, vợ Cả, vợ Hai… xếp hai bên. Người phụ nữ có nhiều chồng cũng xếp tương tự. Con đi xuống từ trung điểm của đúng cặp cha–mẹ, anh em theo `birth_order`. Nén cây con để không chồng lấn. Các cây rời đặt cạnh nhau.
- [ ] Vitest gồm: nhiều vợ, nhiều chồng, con riêng hoặc con nuôi, thu gọn, dòng ngoại bị ẩn, 2 cây rời, **kiểm tra không có nút nào chồng lấn**, và 500 nút chạy dưới 50 ms.
- [ ] Trang `/dev/cay` (chỉ có ở chế độ dev): vẽ SVG thô từ kết quả layout với dữ liệu thật.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở `/dev/cay` với dữ liệu mẫu (A có 2 vợ, mỗi vợ có con): con của vợ Cả nằm dưới cặp A–B, con của vợ Hai nằm dưới cặp A–C.
2. Thu gọn A: toàn bộ con cháu của A biến mất và không để lại khoảng trống.
3. Bật ẩn dòng ngoại: rể và cháu ngoại biến mất.
4. Chạy `npm test`: toàn bộ test layout xanh.

**➡️ Đợt tiếp:** Đợt 16 — Cây FE: hiển thị và thao tác · Model **Opus** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 16 — Cây FE: hiển thị và thao tác theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 16, roadmap/IDEA.md §8, docs/DECISIONS.md (#33a), .claude/rules/frontend.md. Dùng @xyflow/react hiển thị kết quả của layoutTree: node thành viên theo DESIGN.md, cột "Đời 01…N" cố định bên trái, zoom/kéo/pinch, thu gọn, tìm và nhảy tới, xem cây từ người này, tổ tiên của tôi, mặc định 3 đời trên điện thoại, nút "Ẩn dòng ngoại", menu ô cho Manager dùng lại dialog của Đợt 12. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 16. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 16 — Cây FE: hiển thị và thao tác ⬜
IDEA §8 · DECISIONS #33a
- [ ] Trang Cây: React Flow chỉ hiển thị kết quả của `layoutTree`. `MemberNode` theo DESIGN §5 (người đã mất có viền xám và ✝, nhãn đặc biệt). Đường nối hôn nhân và cha mẹ–con.
- [ ] Cột trái cố định "Đời 01…N", đồng bộ trục y với viewport.
- [ ] Zoom, kéo, pinch. Thu gọn hoặc mở từng nhánh. Ô tìm kiếm nhảy tới người cần tìm và làm nổi bật. "Xem cây từ người này", "Xem tổ tiên của tôi". Bật `onlyRenderVisibleElements` để 500 nút vẫn mượt.
- [ ] Trên điện thoại: mặc định hiện 3 đời quanh người được chọn (hoặc chính mình), chạm để mở rộng.
- [ ] Nút "Ẩn dòng ngoại", lưu qua `PUT /api/me/preferences`.
- [ ] Menu khi bấm vào ô: Manager và Admin có "+ Con", "+ Vợ/Chồng", "+ Cha/Mẹ", "Sửa". User **không có menu** thao tác, chỉ có "Xem chi tiết". Mục khóa/xóa để GĐ3.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở Cây ở khổ 1280px: cột Đời vẫn đứng yên khi kéo ngang và khớp khi kéo dọc.
2. Tìm "Chấn": camera bay tới và ô được làm nổi bật.
3. Bấm vào ô A, chọn "+ Con" rồi lưu: cây cập nhật mà không phải tải lại trang.
4. Bật Ẩn dòng ngoại, F5: lựa chọn vẫn được giữ.
5. Ở khổ 375px: chỉ thấy 3 đời, pinch zoom mượt, chạm vào ô thì mở rộng.
6. Đăng nhập bằng User: bấm vào ô chỉ thấy "Xem chi tiết".

**➡️ Đợt tiếp:** Đợt 17 — Sự kiện chung BE · Model **Sonnet** · Effort **low** · Skill: `code-review`
```text
Làm Đợt 17 — Sự kiện chung BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 17, roadmap/IDEA.md §4 và §6.5, .claude/rules/backend.md. Làm bảng custom_event và CRUD (Manager/Admin), sự kiện theo âm hoặc dương, lặp hằng năm khi year để trống, kiểm tra ngày âm hợp lệ qua CalendarFacade. Chỉ làm checklist Đợt 17. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 17 — Sự kiện chung BE ⬜
IDEA §4, §6.5
- [ ] `V8__custom_event.sql`.
- [ ] CRUD `/api/events` (Manager/Admin ghi, mọi người trong family đọc). Kiểm tra `calendar`, `is_leap`, ngày/tháng hợp lệ. `year = NULL` nghĩa là lặp hằng năm.
- [ ] Ghi audit log. Viết facade `EventFacade` để module calendar dùng.
- [ ] Test: validation, User không ghi được, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dùng Manager, tạo "Họp họ" vào 10/1 âm, lặp hằng năm.
2. Tạo "Khánh thành nhà thờ" vào 20/11/2026 dương, chỉ một lần.
3. Dùng User gọi `POST /api/events`: nhận 403.

**➡️ Đợt tiếp:** Đợt 18 — Lịch nhắc BE · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 18 — Lịch nhắc BE (occurrences) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 18, roadmap/IDEA.md §6.5 và §7, docs/DECISIONS.md (#31), .claude/rules/backend.md. Viết OccurrenceService sinh các lần xảy ra của giỗ/sinh nhật/sự kiện chung trong một khoảng ngày (dùng AnniversaryRules, bỏ member bị khóa), API sắp tới, lịch tháng, vừa qua. Chỉ làm checklist Đợt 18. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 18 — Lịch nhắc BE (occurrences) ⬜
IDEA §6.5, §7 · DECISIONS #31
- [ ] `OccurrenceService.between(familyId, from, to, types)`: sinh các lần xảy ra của giỗ (người đã mất, theo `AnniversaryRules`, ghi "giỗ lần thứ N" nếu biết năm mất), sinh nhật (người còn sống, âm hoặc dương, "tròn N tuổi" nếu biết năm sinh), và sự kiện chung. Loại member bị khóa. Mỗi lần xảy ra có một `eventKey` ổn định (dùng lại ở Đợt 28).
- [ ] `GET /api/calendar/upcoming?days=7|15|30|90|365&type=&sort=asc|desc`, có "còn N ngày".
- [ ] `GET /api/calendar/month?year=&month=&mode=solar|lunar`: trả các ngày kèm ngày âm và sự kiện.
- [ ] `GET /api/calendar/recent?limit=10`.
- [ ] Test: khoảng ngày vắt qua năm (tháng 12 sang tháng 1), tháng nhuận, ngày 30 dời sang 29, 29/2, ngày ghi đè, người bị khóa không xuất hiện.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tạo người đã mất có ngày giỗ âm rơi vào khoảng 10 ngày tới.
2. Gọi `GET /api/calendar/upcoming?days=15`: có mục "Giỗ … còn N ngày, giỗ lần thứ N".
3. Gọi `GET /api/calendar/month` cho tháng hiện tại: ngày đó có sự kiện, và mỗi ngày đều có ngày âm.
4. Đặt `memorial_override_*` cho người đó: ngày giỗ đổi theo.

**➡️ Đợt tiếp:** Đợt 19 — Lịch FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 19 — Lịch FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 19, roadmap/IDEA.md §6.5, .claude/rules/frontend.md. Chạy npm run gen:api trước. Làm trang Lịch gồm tab "Sắp tới" (khoảng ngày, lọc, sắp xếp), tab "Lịch tháng" (ô ngày dương lớn/âm nhỏ, chấm màu theo loại, nút gạt xem theo âm, bấm ngày để xem sự kiện, danh sách theo tuần trên điện thoại), và form sự kiện chung cho Manager. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 19. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 19 — Lịch FE ⬜
IDEA §6.5 · DESIGN §1 (màu sự kiện), §5
- [ ] Tab "Sắp tới": chọn khoảng 7/15/30/90 ngày hoặc cả năm, lọc theo loại, sắp xếp gần nhất/xa nhất. Mỗi dòng có icon và màu theo loại, kèm "còn N ngày", "giỗ lần thứ N", "tròn N tuổi".
- [ ] Tab "Lịch tháng": mỗi ô có ngày dương lớn, ngày âm nhỏ và chấm màu. Nút gạt "Xem theo âm". Bấm vào ngày thì mở sheet danh sách sự kiện. Trên điện thoại (<768px) hiện danh sách theo tuần.
- [ ] Form sự kiện chung cho Manager (dùng `DualDateInput`, lặp hằng năm hoặc một lần), có sửa và xóa.
- [ ] Chú giải màu có kèm chữ, không phân biệt loại chỉ bằng màu.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở Lịch > Sắp tới, chọn 30 ngày, lọc Giỗ: chỉ còn các ngày giỗ.
2. Mở Lịch tháng ở khổ 1280px: ô ngày giỗ có chấm tím, ngày âm hiện đúng.
3. Bật "Xem theo âm": lưới đổi sang tháng âm.
4. Ở khổ 375px: hiện danh sách theo tuần.
5. Dùng Manager thêm sự kiện chung: sự kiện hiện ngay trên lịch.

**➡️ Đợt tiếp:** Đợt 20 — Dashboard · Model **Sonnet** · Effort **medium** · Skill: `code-review`, `ui-ux-pro-max`, `run`, `dataviz`
```text
Làm Đợt 20 — Dashboard (BE rồi FE) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 20, roadmap/IDEA.md §6.8, .claude/rules/backend.md và .claude/rules/frontend.md. BE: GET /api/dashboard (thẻ số liệu, sự kiện gần nhất, 10 sự kiện vừa qua, 30 ngày tới, số yêu cầu chờ duyệt cho Manager). FE: trang Tổng quan gồm các ô số liệu, đếm ngược, danh sách. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 20. Xong khi `.\mvnw.cmd verify`, `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, ui-ux-pro-max, run, dataviz. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 20 — Dashboard (BE + FE) ⬜
IDEA §6.8
- [ ] BE `GET /api/dashboard`: tổng thành viên, còn sống/đã mất, số đời, số chi, sự kiện gần nhất, 10 sự kiện vừa qua, danh sách 30 ngày tới. Manager có thêm `pendingLinkRequests`, và `pendingProposals` (bằng 0 cho tới GĐ2). Không tính member bị khóa.
- [ ] BE test: số liệu đúng khi có member bị khóa, truy cập chéo family.
- [ ] FE trang Tổng quan: hàng thẻ số liệu (dùng stat tile theo dataviz, số dạng tabular), thẻ navy "Sắp tới" có đếm ngược, danh sách 30 ngày, danh sách 10 sự kiện vừa qua. Manager có thẻ "Chờ duyệt" dẫn tới trang duyệt.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở Tổng quan ở khổ 1280px: 4 thẻ số liệu khớp với số liệu trên trang Thành viên.
2. Khóa một người trong DB (`locked=1`), F5: tổng giảm đi 1.
3. Dùng Manager, tạo một yêu cầu liên kết: thẻ Chờ duyệt hiện 1.
4. Ở khổ 375px: các thẻ xếp thành một cột và đọc được rõ.

**➡️ Đợt tiếp:** Đợt 21 — PWA · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 21 — PWA theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 21, roadmap/IDEA.md §1 và §9, docs/DECISIONS.md (#38), .claude/rules/frontend.md. Cấu hình vite-plugin-pwa: manifest, icon, cache app shell, NetworkFirst cho GET /api (trừ /api/auth), thông báo khi có bản cập nhật, hướng dẫn cài lên màn hình chính cho iOS, banner khi mất mạng. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 21. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 21 — PWA ⬜
IDEA §1, §9 · DECISIONS #38
- [ ] `vite-plugin-pwa`: manifest (tên "Gia Phả", `theme_color` là màu primary, `display: standalone`), bộ icon 192/512/maskable.
- [ ] Service worker: precache app shell. Chiến lược NetworkFirst cho `GET /api/**`, trừ `/api/auth/**`. Không cache request ghi.
- [ ] Toast "Có bản mới" kèm nút tải lại. Banner "Đang offline — dữ liệu có thể cũ".
- [ ] Hướng dẫn cài: Android và máy tính dùng `beforeinstallprompt`, iOS hiện hướng dẫn "Chia sẻ → Thêm vào MH chính".
- [ ] Chạy Lighthouse trên bản build: PWA đạt yêu cầu cài đặt, Performance trên mobile ≥ 80.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có (chạy thật trên HTTPS ở Đợt 23).

**🧪 Test thủ công (từng bước):**
1. `npm run build` rồi `npm run preview`, mở Chrome, trên thanh địa chỉ phải có nút cài app.
2. Cài app: mở ra dạng cửa sổ riêng, có icon đúng.
3. Xem cây và lịch một lần. DevTools > Network > Offline, F5: vẫn xem được dữ liệu cũ, có banner offline.
4. Build lại sau khi sửa một chữ bất kỳ: hiện toast "Có bản mới".

**➡️ Đợt tiếp:** Đợt 22 — E2E Playwright GĐ1 · Model **Sonnet** · Effort **medium** · Skill: `run`, `code-review`
```text
Làm Đợt 22 — E2E Playwright GĐ1 theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 22, docs/DECISIONS.md (#45), .claude/rules/frontend.md. Cài Playwright trong apps/frontend, viết 3 luồng: đăng ký + OTP (đọc OTP qua endpoint test chỉ bật ở profile e2e), tạo dòng họ + mời, thêm member + thấy trên cây. Chạy app và kiểm tra ở khổ 375px và 1280px. Chỉ làm checklist Đợt 22. Xong khi `npm run lint`, `npm run build` và `npx playwright test` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: run, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 22 — E2E Playwright GĐ1 ⬜
DECISIONS #45
- [ ] Cài Playwright, dùng 2 project `mobile` (375px) và `desktop` (1280px).
- [ ] BE profile `e2e`: `InMemoryMailSender` + endpoint `GET /api/test/last-otp`. **Chỉ bật ở profile e2e**, và có test đảm bảo endpoint này không tồn tại ở profile prod.
- [ ] 3 luồng: đăng ký + OTP; tạo dòng họ + tạo mã + user thứ hai tham gia; thêm member + "+ Con" + thấy người đó trên cây.
- [ ] Script `npm run e2e`, có hướng dẫn chạy trong README của frontend.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** `npx playwright install chromium`.

**🧪 Test thủ công (từng bước):**
1. Chạy backend với `-Dspring-boot.run.profiles=dev,e2e` và `npm run dev`.
2. Chạy `npm run e2e`: cả 3 luồng đều xanh ở cả 2 khổ màn hình.
3. Chạy backend ở profile `prod` (local), gọi `/api/test/last-otp`: nhận 404.

**➡️ Đợt tiếp:** Đợt 23 — Deploy production GĐ1 · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 23 — Deploy production GĐ1 theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 23, roadmap/IDEA.md §11, docs/DECISIONS.md (#39–43), .claude/rules/security.md. Viết Dockerfile BE (arm64), image nginx chứa FE, docker-compose.prod.yml, cấu hình nginx (HTTPS, /api, SPA fallback, security header), certbot, script backup lên Object Storage, workflow deploy.yml (build arm64, đẩy GHCR, deploy qua SSH). Chỉ làm checklist Đợt 23. Xong khi `.\mvnw.cmd verify`, `npm run build` pass và `docker compose -f infra/docker-compose.prod.yml config` hợp lệ. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 23 — Deploy production GĐ1 ⬜
IDEA §11 · DECISIONS #39–43
- [ ] `apps/backend/Dockerfile` (multi-stage, JRE 21, `linux/arm64`, chạy bằng user không phải root). `infra/nginx/Dockerfile` build FE rồi copy `dist` vào nginx.
- [ ] `infra/docker-compose.prod.yml`: nginx, app, mysql (có volume, không mở cổng ra ngoài), certbot. Healthcheck cho từng service.
- [ ] Cấu hình nginx: chuyển HTTP sang HTTPS, `/api` proxy tới app, SPA fallback, gzip, cache dài cho asset có hash, header HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`. `sw.js` không cache.
- [ ] `infra/backup/backup.sh`: `mysqldump`, gzip, đẩy lên Object Storage, xóa bản cũ hơn 30 ngày. Có mẫu dòng cron.
- [ ] `.github/workflows/deploy.yml`: chạy bằng `workflow_dispatch` hoặc tag `v*`. Build buildx arm64, đẩy GHCR, SSH vào server chạy `docker compose pull && up -d`.
- [ ] `infra/README.md`: runbook gồm lần deploy đầu, gia hạn chứng chỉ, khôi phục từ backup.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Tạo VM Oracle Cloud Always Free (Ampere A1, Ubuntu). Mở cổng 80 và 443 ở cả Security List lẫn iptables. Cài Docker.
- Tạo tên miền DuckDNS, đặt cron cập nhật IP.
- Chạy certbot lần đầu để lấy chứng chỉ.
- Đặt `.env` production lên server (`chmod 600`).
- Thêm GitHub Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`. Kiểm tra quyền GHCR.
- Tạo bucket Object Storage và cấu hình credential cho script backup.
- Google OAuth: thêm origin `https://<ten>.duckdns.org`. Cấu hình SMTP thật (`MAIL_*`).

**🧪 Test thủ công (từng bước):**
1. Chạy workflow Deploy: tất cả các bước xanh.
2. Mở `https://<ten>.duckdns.org`: có ổ khóa HTTPS, trang đăng nhập hiện ra.
3. Kiểm tra `curl -I`: có đủ các security header. Truy cập bằng `http://` thì bị chuyển sang `https://`.
4. Đăng ký bằng email thật: nhận được OTP qua mail.
5. Cài PWA trên Android và iPhone (Thêm vào màn hình chính).
6. Chạy `backup.sh` bằng tay: có file trên Object Storage. Khôi phục vào DB tạm để thử.

**➡️ Đợt tiếp:** Đợt 24 — Lịch sử thay đổi · Model **Sonnet** · Effort **medium** · Skill: `code-review`, `ui-ux-pro-max`, `run`
```text
Làm Đợt 24 — Lịch sử thay đổi (BE rồi FE) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 24, roadmap/IDEA.md §6.3 và §12, docs/DECISIONS.md (#33b), .claude/rules/backend.md và .claude/rules/frontend.md. BE: API đọc audit_log theo member (phân trang, ghi tên người sửa). FE: tab "Lịch sử thay đổi" hiện diff trước/sau dễ đọc. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 24. Xong khi `.\mvnw.cmd verify`, `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN 2 — TƯƠNG TÁC

### Đợt 24 — Lịch sử thay đổi (BE + FE) ⬜
IDEA §6.3, §12 · DECISIONS #33b
- [ ] BE `GET /api/members/{id}/history`: phân trang, gồm người sửa, thời điểm, và danh sách trường thay đổi (tính từ `before`/`after`). Ẩn SĐT và email trong diff với người không có quyền xem.
- [ ] BE test: ẩn trường nhạy cảm, truy cập chéo family.
- [ ] FE: tab "Lịch sử" trong trang chi tiết, dạng timeline, mỗi mục hiện "Trường: cũ → mới" với nhãn tiếng Việt.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Sửa tên và năm sinh của D.
2. Mở tab Lịch sử: thấy "Họ tên: … → …", "Năm sinh: … → …", kèm người sửa và thời gian.
3. Dùng User xem lịch sử có đổi SĐT: SĐT bị ẩn.

**➡️ Đợt tiếp:** Đợt 25 — Đề xuất BE · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 25 — Đề xuất BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 25, roadmap/IDEA.md §4 và §6.6, .claude/rules/backend.md. Làm bảng proposal, User tạo đề xuất (payload + diff do server tính + base_updated_at), hàng đợi của Manager, duyệt (có thể chỉnh payload) và áp dụng qua facade trong một transaction, từ chối kèm lý do, cảnh báo xung đột, publish event ProposalReviewed. Chỉ làm checklist Đợt 25. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 25 — Đề xuất BE ⬜
IDEA §4, §6.6
- [ ] `V9__proposal.sql`.
- [ ] `POST /api/proposals`: `target_type` MEMBER/MARRIAGE/EVENT/BRANCH, `action` CREATE/UPDATE/DELETE. Server tự tính `diff` và lưu `base_updated_at`. Validate payload bằng cùng validator với API ghi trực tiếp.
- [ ] `GET /api/proposals/mine`. Manager có `GET /api/proposals?status=PENDING` và `count`.
- [ ] `POST /{id}/approve` (nhận payload đã chỉnh, tùy chọn): áp dụng qua `MemberFacade`/`EventFacade` trong một transaction, có ghi audit log. `POST /{id}/reject` kèm `note`. Proposal DELETE chỉ mang tính thông báo: duyệt là đánh dấu "đã ghi nhận", không xóa.
- [ ] Cảnh báo xung đột: khi `target.updated_at > base_updated_at` thì response có `conflict: true`.
- [ ] Publish `ProposalReviewed` (application event) để Đợt 27 tiêu thụ. `pendingProposals` trên dashboard lấy số thật.
- [ ] Test: User tạo, Manager duyệt đúng dữ liệu, trường hợp xung đột, User không duyệt được, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User đề xuất sửa năm sinh của D. Manager gọi `GET /api/proposals`: thấy diff.
2. Manager tự sửa tên D trực tiếp, rồi mở đề xuất: có `conflict: true`.
3. Manager duyệt kèm năm sinh đã chỉnh lại: D được cập nhật, `audit_log` có bản ghi.
4. Tạo đề xuất khác rồi từ chối kèm lý do: trạng thái là REJECTED, có `review_note`.

**➡️ Đợt tiếp:** Đợt 26 — Đề xuất FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 26 — Đề xuất FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 26, roadmap/IDEA.md §6.6 và §8 (menu), .claude/rules/frontend.md. Chạy npm run gen:api. Làm menu "Đề xuất…" cho User trên cây và trang member (dùng lại form/dialog ở chế độ đề xuất), trang "Đề xuất của tôi", hàng đợi của Manager có badge, xem diff, chỉnh rồi duyệt, từ chối kèm lý do, cảnh báo xung đột. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 26. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 26 — Đề xuất FE ⬜
IDEA §6.6, §8
- [ ] Thêm prop `mode: 'direct' | 'proposal'` cho form và dialog của Đợt 12. User thấy các mục "Đề xuất thêm con…", "Đề xuất sửa…", "Đề xuất xóa…" trên cây và trang member.
- [ ] Trang "Đề xuất của tôi" hiện trạng thái và lý do bị từ chối.
- [ ] Manager có badge số đang chờ trên menu, trang hàng đợi, và trang chi tiết gồm diff 2 cột, sửa payload, Duyệt, Từ chối kèm lý do. Banner cảnh báo khi `conflict`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng nhập bằng User, bấm vào ô trên cây, chọn "Đề xuất sửa…", đổi năm sinh rồi gửi.
2. Đăng nhập bằng Manager: badge hiện 1. Mở đề xuất: diff đỏ/xanh dễ đọc.
3. Chỉnh năm sinh rồi Duyệt: cây cập nhật.
4. Ở khổ 375px: diff hiện theo chiều dọc, không bị tràn ngang.

**➡️ Đợt tiếp:** Đợt 27 — Thông báo BE: hộp thư, tùy chọn · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 27 — Thông báo BE: hộp thư, tùy chọn theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 27, roadmap/IDEA.md §4 và §9, .claude/rules/backend.md. Làm bảng notification và notification_pref, API hộp thư (danh sách, số chưa đọc, đánh dấu đã đọc), API tùy chọn, listener ProposalReviewed và kết quả liên kết để tạo thông báo. Chỉ làm checklist Đợt 27. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 27 — Thông báo BE: hộp thư, tùy chọn ⬜
IDEA §4, §9
- [ ] `V10__notification.sql`: `notification`, `notification_pref` (giá trị mặc định được tạo khi user được tạo, hoặc tạo lười khi đọc lần đầu).
- [ ] `GET /api/notifications` (phân trang), `GET /unread-count`, `POST /{id}/read`, `POST /read-all`.
- [ ] `GET/PUT /api/notifications/preferences`: bật/tắt 3 loại, các mốc `[30,7,3,1,0]`, giờ `send_hour` từ 0 đến 23.
- [ ] Listener: `ProposalReviewed` → thông báo cho người đề xuất. Duyệt/từ chối liên kết → thông báo cho user. Đề xuất mới → thông báo cho Manager.
- [ ] Test: chỉ đọc được thông báo của chính mình, giá trị mặc định của tùy chọn.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. User gửi đề xuất: Manager gọi `unread-count` được 1.
2. Manager duyệt: User nhận thông báo "Đề xuất đã được duyệt".
3. `PUT /preferences` tắt sinh nhật, rồi `GET` lại: giá trị được giữ.

**➡️ Đợt tiếp:** Đợt 28 — Web Push BE · Model **Sonnet** · Effort **high** · Skill: `code-review`
```text
Làm Đợt 28 — Web Push BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 28, roadmap/IDEA.md §9, docs/DECISIONS.md (#46), .claude/rules/backend.md. Làm bảng push_subscription và notification_dispatch, đăng ký/hủy đăng ký, gửi thử, job chạy mỗi giờ (+7) gom bản tin theo send_hour, các mốc và loại đã bật, chống gửi trùng, xóa subscription khi gặp 404/410. Web push đặt sau interface. Chỉ làm checklist Đợt 28. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 28 — Web Push BE ⬜
IDEA §9 · DECISIONS #46
- [ ] `V11__push.sql`: `push_subscription`, `notification_dispatch` (UNIQUE trên 4 cột).
- [ ] `PushSender` (interface) và bản cài bằng `nl.martijndwars:web-push` + khóa VAPID. `GET /api/push/public-key`, `POST /api/push/subscribe`, `DELETE /api/push/subscribe`, `POST /api/push/test`.
- [ ] `DigestJob` (`@Scheduled` mỗi giờ, zone +7): với user có `send_hour` bằng giờ hiện tại, lấy `OccurrenceService` tại các mốc đã bật (30/7/3/1/0) và loại đã bật, gộp thành một bản tin. Không còn mục nào thì không gửi. Ghi `notification` (vào hộp thư) và gửi push. Ghi `notification_dispatch` để chống gửi trùng.
- [ ] Gặp 404/410 thì xóa subscription. Gửi thành công thì cập nhật `last_ok_at`.
- [ ] Test: nội dung bản tin (ví dụ "Còn 3 ngày: Giỗ cụ …; Hôm nay: sinh nhật …"), mốc bị tắt thì bỏ khỏi bản tin, bản tin rỗng thì không gửi, chạy job 2 lần không gửi trùng, 410 thì xóa.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Sinh khóa VAPID (`npx web-push generate-vapid-keys`), điền `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:…` vào `.env` (cả dev lẫn prod).

**🧪 Test thủ công (từng bước):**
1. Dùng một trang HTML tạm hoặc chờ Đợt 29 để có subscription, rồi `POST /api/push/test`: nhận được push.
2. Đặt `send_hour` bằng giờ hiện tại, tạo một ngày giỗ còn 3 ngày, rồi gọi endpoint chạy job (chỉ có ở dev): nhận một bản tin.
3. Chạy lại job: không nhận thêm (chống trùng).

**➡️ Đợt tiếp:** Đợt 29 — Thông báo FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 29 — Thông báo FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 29, roadmap/IDEA.md §9, .claude/rules/frontend.md. Chạy npm run gen:api. Làm chuông có số chưa đọc và trang hộp thư, trang Cài đặt thông báo (loại, mốc, giờ nhận, trạng thái thiết bị, nút đăng ký push, Gửi thử), xử lý push trong service worker, hướng dẫn bật thông báo theo từng loại thiết bị ở lần đăng nhập đầu. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 29. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 29 — Thông báo FE ⬜
IDEA §9
- [ ] Chuông trên Header và BottomNav, có badge số chưa đọc (refetch khi focus lại cửa sổ). Trang hộp thư có "Đánh dấu đã đọc hết", bấm vào thông báo thì đi tới `link`.
- [ ] Trang Cài đặt thông báo: công tắc 3 loại, các mốc, giờ nhận. Trạng thái "Thiết bị này: đã/chưa nhận thông báo". Nút "Bật thông báo" (xin quyền và subscribe). Nút "Gửi thử".
- [ ] Service worker (injectManifest): xử lý sự kiện `push` để hiện notification, `notificationclick` để mở hoặc focus app tại `link`.
- [ ] Hướng dẫn ở lần đăng nhập đầu, tùy thiết bị: Android/máy tính thì bấm "Cho phép", iOS <16.4 thì báo không hỗ trợ, iOS ≥16.4 chưa cài app thì hướng dẫn "Thêm vào MH chính" trước.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có (VAPID đã có ở Đợt 28). Muốn test trên điện thoại thì cần HTTPS (dùng prod hoặc tunnel).

**🧪 Test thủ công (từng bước):**
1. Chrome máy tính: vào Cài đặt thông báo, bấm Bật, rồi cho phép. Trạng thái chuyển sang "đã nhận".
2. Bấm "Gửi thử": notification của hệ điều hành hiện lên, bấm vào thì mở đúng app.
3. User gửi đề xuất: chuông của Manager tăng lên 1.
4. Trên iPhone đã cài PWA (bản prod): bật thông báo và Gửi thử thành công.

**➡️ Đợt tiếp:** Đợt 30 — Đính kèm BE · Model **Sonnet** · Effort **medium** · Skill: `code-review`
```text
Làm Đợt 30 — Đính kèm BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 30, roadmap/IDEA.md §6.7, .claude/rules/backend.md và .claude/rules/security.md. Mở rộng module file cho kind DOCUMENT: gắn vào member hoặc family, có tiêu đề, danh sách, xóa (Manager), kiểm tra jpg/png/webp/pdf/docx/xlsx, 10 MB, quota 1 GB. Chỉ làm checklist Đợt 30. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 30 — Đính kèm BE ⬜
IDEA §6.7
- [ ] Mở rộng `sign/confirm` cho `kind=DOCUMENT` (resource type `raw` cho pdf/docx/xlsx), có `title`, gắn vào `member_id` hoặc family.
- [ ] `GET /api/members/{id}/attachments`, `GET /api/family/attachments`, `DELETE /api/attachments/{id}` (Manager/Admin, xóa luôn trên Cloudinary).
- [ ] Link tải file docx/xlsx dùng URL có chữ ký, hết hạn sau một thời gian ngắn.
- [ ] Ghi audit log. Test: sai MIME, quá 10 MB, vượt quota, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Upload một file PDF gắn vào D: xuất hiện trong danh sách đính kèm của D.
2. Upload file `.exe` đổi đuôi thành `.pdf`: bị từ chối.
3. Manager xóa file: file biến mất cả ở danh sách lẫn trên Cloudinary.

**➡️ Đợt tiếp:** Đợt 31 — Đính kèm FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`, `dataviz`
```text
Làm Đợt 31 — Đính kèm FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 31, roadmap/IDEA.md §6.7, .claude/rules/frontend.md. Chạy npm run gen:api. Làm tab "Tệp đính kèm" ở trang member và mục đính kèm của family: upload có tiến độ, xem trước ảnh/PDF, tải file, xóa (Manager), thanh quota dung lượng. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 31. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, dataviz. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 31 — Đính kèm FE ⬜
IDEA §6.7
- [ ] Tab "Tệp đính kèm": lưới ảnh thu nhỏ và danh sách tài liệu. Upload bằng kéo thả hoặc chọn file, có thanh tiến độ. Báo lỗi ngay khi sai định dạng hoặc quá kích thước.
- [ ] Xem trước ảnh (lightbox) và PDF (tab mới). docx/xlsx thì tải về.
- [ ] Manager có nút xóa (kèm hộp xác nhận). Trang Dòng họ có mục "Tài liệu chung".
- [ ] Thanh quota "x MB / 1 GB" dạng meter theo dataviz, có kèm chữ.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Kéo 3 ảnh vào tab Tệp đính kèm: tiến độ chạy, ảnh thu nhỏ hiện ra.
2. Bấm vào ảnh: lightbox mở. Bấm vào PDF: mở tab mới.
3. Upload file 12 MB: báo lỗi trước khi gửi đi.
4. Thanh quota tăng đúng với dung lượng vừa upload.

**➡️ Đợt tiếp:** Đợt 32 — Quản trị BE: user, family, cấu hình · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 32 — Quản trị BE: user, family, cấu hình theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 32, roadmap/IDEA.md §3 và §6.10, docs/DECISIONS.md (#22), .claude/rules/backend.md và .claude/rules/security.md. Làm module admin: tìm user, khóa/mở tài khoản (MANUAL, thu hồi token), danh sách family, Admin chọn family làm ngữ cảnh, chuyển quyền Manager, bảng system_setting (policy_version, quota AI, giới hạn upload). Chỉ ADMIN được gọi. Chỉ làm checklist Đợt 32. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

# GIAI ĐOẠN 3 — NÂNG CAO

### Đợt 32 — Quản trị BE: user, family, cấu hình ⬜
IDEA §3, §6.10 · DECISIONS #22
- [ ] `/api/admin/**` chỉ cho `sysRole=ADMIN` (có test cho từng endpoint).
- [ ] User: tìm kiếm, khóa/mở khóa (`lock_reason=MANUAL`, thu hồi refresh token). Không được tự khóa chính mình.
- [ ] Family: xem danh sách và chi tiết, chuyển quyền Manager.
- [ ] Ngữ cảnh family của Admin: header `X-Family-Id`, **chỉ có hiệu lực với ADMIN**. `CurrentUser.familyId()` trả family đang chọn, nên mọi API nghiệp vụ dùng lại được cho Admin.
- [ ] `V12__system_setting.sql`: key-value (`policy_version`, `ai_quota_user`, `ai_quota_manager`, `upload_max_mb`, `family_quota_mb`), có cache Caffeine. `GET/PUT /api/admin/settings`.
- [ ] Ghi audit log cho mọi thao tác admin. Test: User hoặc Manager gọi `/api/admin` nhận 403. User gửi `X-Family-Id` thì bị bỏ qua.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Tạo tài khoản Admin đầu tiên. Đề xuất: biến `BOOTSTRAP_ADMIN_EMAIL`, khi user có email này đăng ký và xác thực thì tự thành ADMIN (một lần duy nhất).

**🧪 Test thủ công (từng bước):**
1. Đăng nhập bằng Admin, `GET /api/admin/users?q=…`, khóa user B. B gọi refresh thì bị từ chối, đăng nhập cũng bị từ chối.
2. Admin gửi header `X-Family-Id: 1` và gọi `GET /api/members`: thấy member của family 1.
3. User thường gửi `X-Family-Id` của family khác: vẫn chỉ thấy family của mình.
4. Đổi `ai_quota_user` thành 20: `GET` trả về 20.

**➡️ Đợt tiếp:** Đợt 33 — Khóa nhánh và xóa member BE · Model **Opus** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 33 — Khóa nhánh và xóa member BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 33, roadmap/IDEA.md §5 (toàn bộ), .claude/rules/backend.md và .claude/rules/security.md. Làm khóa nhánh (DIRECT/INHERITED, lock_root_id, gồm cả dâu/rể trong nhánh, chặn khi nhánh chứa Manager, khóa tài khoản liên kết với MEMBER_LOCKED và thu hồi token), mở khóa (giữ nguyên người bị khóa DIRECT riêng), xóa cứng (chỉ người chưa có con, tự gỡ hôn nhân, gỡ liên kết tài khoản, lưu snapshot đầy đủ vào audit). Chỉ ADMIN. Chỉ làm checklist Đợt 33. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 33 — Khóa nhánh và xóa member BE ⬜
IDEA §5
- [ ] `BranchLockService.lock(memberId, reason)`: duyệt nhánh (người đó, toàn bộ con cháu, và dâu/rể của mọi người trong nhánh). Người được chọn là `DIRECT`, những người còn lại là `INHERITED` với `lock_root_id` là người được chọn. Người **đã bị khóa từ trước thì giữ nguyên** trạng thái cũ. Nếu nhánh có Manager thì chặn với lỗi rõ ràng.
- [ ] Tài khoản liên kết với người bị khóa chuyển `LOCKED` + `MEMBER_LOCKED` và bị thu hồi mọi refresh token.
- [ ] `unlock(rootId)`: mở những người `INHERITED` có cùng `lock_root_id`. Người `DIRECT` khác trong nhánh vẫn giữ khóa. Mở lại tài khoản có `MEMBER_LOCKED`.
- [ ] `delete(memberId)`: chặn nếu người đó có con (gợi ý dùng Khóa). Tự gỡ hôn nhân. Đặt `user.member_id = NULL`. Audit ghi **snapshot đầy đủ** (member, các hôn nhân, file đính kèm) trước khi xóa cứng. Tất cả trong một transaction.
- [ ] `GET /api/admin/members/locked?familyId=&rootId=`, `GET /api/admin/audit/deleted` (xem các snapshot).
- [ ] Test: nhánh 3 đời có dâu, khóa lồng nhau rồi mở khóa gốc, chặn khi nhánh có Manager, tài khoản bị khóa rồi mở lại, xóa người có con bị chặn, snapshot đủ dữ liệu, sau khi khóa thì cây/lịch/dashboard/occurrences không còn người đó.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin khóa A (có con D, E và con dâu): trên cây không còn nhánh A, dashboard giảm đúng số người.
2. User đã liên kết với D thử đăng nhập: bị từ chối.
3. Trước đó khóa riêng E, rồi mở khóa A: D mở lại, E vẫn bị khóa.
4. Thử khóa nhánh chứa Manager: bị chặn kèm thông báo "chuyển quyền Manager trước".
5. Xóa H (không có con, có vợ): hôn nhân bị gỡ, snapshot hiện trong `/api/admin/audit/deleted`.

**➡️ Đợt tiếp:** Đợt 34 — Quản trị FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`
```text
Làm Đợt 34 — Quản trị FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 34, roadmap/IDEA.md §6.10 và §8 (menu Admin), .claude/rules/frontend.md. Chạy npm run gen:api. Làm khu /quan-tri: user (tìm, khóa/mở), family (danh sách, chọn làm ngữ cảnh, chuyển quyền Manager), member bị khóa theo nhánh, người đã xóa (snapshot), cấu hình hệ thống; thêm "Khóa nhánh" và "Xóa" vào menu ô trên cây cho Admin (có hộp xác nhận nêu rõ hậu quả). Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 34. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 34 — Quản trị FE ⬜
IDEA §6.10, §8
- [ ] Layout `/quan-tri` riêng, có bộ chọn "Family đang xem" (lưu vào context và gắn `X-Family-Id`).
- [ ] Các trang: Người dùng (tìm, khóa/mở), Dòng họ (danh sách, chuyển quyền Manager), Member bị khóa (lọc theo nhánh, mở khóa), Đã xóa (xem snapshot), Cấu hình.
- [ ] Menu ô trên cây cho Admin có thêm "Khóa nhánh" và "Xóa". Hộp xác nhận nêu số người bị ảnh hưởng và tài khoản bị khóa theo. Khi bị chặn (có con, hoặc nhánh có Manager) thì hiện đúng lý do.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin đăng nhập: vào `/quan-tri`, chọn một family.
2. Vào Cây, bấm vào A, chọn "Khóa nhánh": hộp xác nhận ghi "Sẽ khóa N người, M tài khoản". Xác nhận xong thì nhánh biến mất.
3. Vào Member bị khóa: A xuất hiện, bấm Mở khóa thì nhánh quay lại.
4. Xóa một người có con: hiện "Không thể xóa — người này có con, hãy dùng Khóa".
5. Ở khổ 375px: các bảng chuyển thành dạng thẻ.

**➡️ Đợt tiếp:** Đợt 35 — AI BE: provider, tool, SSE, quota · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 35 — AI BE: provider, tool, SSE, quota theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 35, roadmap/IDEA.md §10, docs/DECISIONS.md (#47), .claude/rules/backend.md và .claude/rules/security.md. Làm interface AiProvider + GeminiProvider (com.google.genai, streaming, function calling), các tool chỉ đọc (searchMembers, getMember, getRelatives, upcomingEvents, lunarConvert, stats) luôn lọc theo family và bỏ member bị khóa, KHÔNG BAO GIỜ gửi SĐT/email; endpoint SSE, bảng ai_usage (quota 15/30 câu, reset 0h +7), bảng ai_message. Có FakeAiProvider cho profile dev và test. Chỉ làm checklist Đợt 35. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 35 — AI BE: provider, tool, SSE, quota ⬜
IDEA §10 · DECISIONS #47
- [ ] `V13__ai.sql`: `ai_usage`, `ai_message`. Mỗi user một luồng chat, job dọn tin nhắn cũ hơn 30 ngày.
- [ ] `AiProvider` và `GeminiProvider` (`com.google.genai`, streaming, function calling). `FakeAiProvider` dùng cho profile dev và test.
- [ ] 6 tool chỉ đọc, gọi qua các facade. DTO riêng cho AI **không có trường SĐT/email**. `familyId` lấy từ token. Member bị khóa không bao giờ được trả về.
- [ ] `POST /api/ai/chat` trả SSE: stream các token, ghi lại `ai_message`. Kiểm tra và tăng `ai_usage` (15 câu với User, 30 câu với Manager/Admin, đọc từ `system_setting`, reset lúc 0h +7). Rate limit bằng bucket4j. `GET /api/ai/quota`.
- [ ] System prompt nêu rõ vai trò, phạm vi, và việc từ chối câu hỏi ngoài phạm vi (phần gợi ý câu hỏi làm ở Đợt 36).
- [ ] Test: DTO của tool không chứa phone/email (kiểm tra bằng reflection), member bị khóa không có trong kết quả, family khác không truy cập được, hết quota thì nhận 429, reset theo giờ +7.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Điền `GEMINI_API_KEY` vào `.env` (prod, và dev nếu muốn thử Gemini thật với `app.ai.provider=gemini`).

**🧪 Test thủ công (từng bước):**
1. Ở profile dev dùng Fake: `curl -N` tới `/api/ai/chat` thấy các token stream về.
2. Bật Gemini thật, hỏi "Ông A có mấy người con?": câu trả lời đúng với dữ liệu.
3. Hỏi "Số điện thoại của D là gì?": AI không có dữ liệu đó để trả lời.
4. Hỏi đủ 15 câu bằng User: câu thứ 16 nhận 429, `/api/ai/quota` bằng 0.

**➡️ Đợt tiếp:** Đợt 36 — AI BE: soạn đề xuất, phạm vi · Model **Sonnet** · Effort **high** · Skill: `security-review`, `code-review`
```text
Làm Đợt 36 — AI BE: soạn đề xuất, phạm vi theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 36, roadmap/IDEA.md §10 và §6.6, .claude/rules/backend.md và .claude/rules/security.md. Thêm tool draftProposal: backend tạo thẻ xem trước có diff (không ghi dữ liệu), sau đó User bấm "Gửi đề xuất" (tạo proposal source=AI) hoặc Manager bấm "Áp dụng" (đi qua đúng luồng duyệt). Từ chối câu hỏi ngoài phạm vi kèm gợi ý. Có test chứng minh AI không bao giờ tự ghi dữ liệu. Chỉ làm checklist Đợt 36. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 36 — AI BE: soạn đề xuất, phạm vi ⬜
IDEA §6.6, §10
- [ ] Tool `draftProposal`: tạo `AiDraft` (lưu tạm, có TTL) gồm payload và diff tính theo cùng logic của module proposal. SSE gửi một event `draft` kèm id. **Không ghi vào dữ liệu gia phả.**
- [ ] `POST /api/ai/drafts/{id}/submit`: User tạo proposal với `source=AI`. `POST /api/ai/drafts/{id}/apply`: Manager tạo và duyệt proposal ngay, có audit log.
- [ ] Câu hỏi ngoài phạm vi: từ chối lịch sự và gợi ý 3 câu hỏi mẫu (có trong system prompt và có test với Fake).
- [ ] Test: tool không có đường ghi dữ liệu nào (không gọi facade ghi), submit/apply chỉ dành cho chủ của draft, draft hết hạn, truy cập chéo family.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dùng User nói "Thêm con trai tên Đặng Văn X cho ông D": nhận event `draft`, DB chưa có member mới.
2. Gọi submit: có proposal `source=AI` trong hàng đợi của Manager.
3. Hỏi "Thời tiết mai thế nào?": bị từ chối kèm gợi ý.

**➡️ Đợt tiếp:** Đợt 37 — AI FE · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `security-review`, `code-review`
```text
Làm Đợt 37 — AI FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 37, roadmap/IDEA.md §10, .claude/rules/frontend.md và .claude/rules/security.md. Chạy npm run gen:api. Làm trang Trợ lý: đọc SSE qua fetch (có Bearer), chữ hiện dần, render markdown an toàn (không dùng dangerouslySetInnerHTML), thẻ xem trước diff có nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Manager), hiện số câu còn lại, hết lượt thì khóa ô nhập, có gợi ý câu hỏi. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 37. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, security-review, code-review. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 37 — AI FE ⬜
IDEA §10
- [ ] Trang "Trợ lý" (trong menu Thêm và sidebar): luồng chat, các chip gợi ý câu hỏi, ô nhập dính ở đáy, trên điện thoại tránh bị bàn phím che.
- [ ] Đọc SSE bằng `fetch` + `ReadableStream` (có Bearer, tự refresh token), chữ hiện dần, có nút Dừng. Render markdown **an toàn**.
- [ ] Thẻ xem trước draft: diff và nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Manager). Sau khi bấm, thẻ chuyển sang trạng thái đã xử lý.
- [ ] Hiện "Còn N câu hôm nay". Hết lượt thì khóa ô nhập và ghi rõ giờ reset.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Hỏi "Ai là cụ tổ?": chữ hiện dần, bộ đếm giảm đi 1.
2. Yêu cầu thêm con cho D: thẻ diff hiện ra. Bấm Gửi đề xuất: thẻ đổi trạng thái, Manager thấy đề xuất mới.
3. Gửi nội dung `<img src=x onerror=alert(1)>`: không có alert nào bật lên.
4. Hết lượt: ô nhập bị khóa, kèm dòng "Làm mới lúc 0h".

**➡️ Đợt tiếp:** Đợt 38 — Export BE · Model **Sonnet** · Effort **high** · Skill: `code-review`, `anthropic-skills:xlsx`, `anthropic-skills:pdf`
```text
Làm Đợt 38 — Export BE (Excel, PDF) theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 38, roadmap/IDEA.md §6.9, docs/DECISIONS.md (#48), .claude/rules/backend.md. Làm module report: Excel danh sách thành viên và sự kiện trong năm (Apache POI), PDF danh sách thành viên và lịch giỗ cả năm theo tháng âm (OpenPDF, nhúng font Be Vietnam Pro); bỏ member bị khóa, SĐT/email chỉ khi người xuất có quyền. Chỉ làm checklist Đợt 38. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, anthropic-skills:xlsx, anthropic-skills:pdf. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 38 — Export BE (Excel, PDF) ⬜
IDEA §6.9 · DECISIONS #48
- [ ] `GET /api/reports/members.xlsx`: có header, cột ngày dạng date, dòng tiêu đề đông cứng, tự căn độ rộng cột. `GET /api/reports/events.xlsx?year=`.
- [ ] `GET /api/reports/members.pdf`, `GET /api/reports/memorials.pdf?lunarYear=` (nhóm theo tháng âm, ghi ngày dương tương ứng). Nhúng font Be Vietnam Pro, khổ A4, có số trang.
- [ ] Bỏ member bị khóa. Cột SĐT/email chỉ có khi người xuất là Manager hoặc Admin. Tên file có tên family và ngày xuất.
- [ ] Test: đọc lại file xlsx bằng POI để kiểm tra số dòng, file PDF chứa đúng chữ có dấu (trích text), member bị khóa không có trong file.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tải `members.xlsx`, mở bằng Excel: tiếng Việt hiện đúng, cột ngày lọc được.
2. Tải `memorials.pdf`: nhóm theo tháng âm, dấu tiếng Việt không bị vỡ.
3. Tải bằng tài khoản User: không có cột SĐT/email.

**➡️ Đợt tiếp:** Đợt 39 — Export FE và in cây khổ lớn · Model **Sonnet** · Effort **high** · Skill: `ui-ux-pro-max`, `run`, `anthropic-skills:pdf`
```text
Làm Đợt 39 — Export FE và in cây khổ lớn theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 39, roadmap/IDEA.md §6.9 và §8 (Kỹ thuật), docs/DECISIONS.md (#34), .claude/rules/frontend.md. Làm trang Xuất dữ liệu (các nút tải Excel/PDF) và chức năng "In cây": dùng lại layoutTree, xuất SVG vector rồi ra PDF khổ A3/A2 (chia trang nếu cần) và PNG độ phân giải cao. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 39. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, anthropic-skills:pdf. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 39 — Export FE và in cây khổ lớn ⬜
IDEA §6.9, §8 · DECISIONS #34
- [ ] Trang "Xuất dữ liệu": các nút tải 4 báo cáo của Đợt 38 (chọn năm hoặc năm âm), có trạng thái đang tải.
- [ ] "In cây" (từ trang Cây): chọn gốc, khổ A3 hoặc A2, dọc hoặc ngang, có hoặc không có ảnh. Dùng lại `layoutTree`, render sang SVG vector (nhúng font), xuất PDF (chia trang theo khổ nếu cây quá lớn, có dấu cắt ghép) và PNG khoảng 300 dpi.
- [ ] Chạy trong Web Worker hoặc chia nhỏ công việc để không treo giao diện với 500 người.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tải từng báo cáo: file mở được.
2. In cây A3 ngang: PDF sắc nét khi zoom 400%, chữ có dấu đúng, bố cục giống hệt màn hình.
3. In cây 500 người khổ A2: có chia trang và dấu ghép, giao diện không bị treo.
4. Xuất PNG: mở được, độ phân giải cao.

**➡️ Đợt tiếp:** Đợt 40 — Import Excel BE · Model **Sonnet** · Effort **high** · Skill: `code-review`, `anthropic-skills:xlsx`
```text
Làm Đợt 40 — Import Excel BE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 40, roadmap/IDEA.md §6.9, .claude/rules/backend.md. TRƯỚC KHI CODE: đề xuất mẫu Excel chi tiết (cột, định dạng, cách khớp tên cha/mẹ/vợ chồng, xử lý trùng tên) và hỏi tôi chốt; ghi quyết định vào docs/DECISIONS.md. Sau đó làm: tải file mẫu, bước kiểm tra thử (dry-run) báo lỗi theo từng dòng, bước nhập thật trong một transaction, tính lại đời/lineage, ghi audit. Chỉ làm checklist Đợt 40. Xong khi `.\mvnw.cmd verify` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: code-review, anthropic-skills:xlsx. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 40 — Import Excel BE ⬜
IDEA §6.9
- [ ] **Chốt mẫu Excel với người dùng** rồi ghi vào `docs/DECISIONS.md`.
- [ ] `GET /api/import/template.xlsx`: có sheet hướng dẫn và data validation (giới tính, ngày âm).
- [ ] `POST /api/import/preview` (dry-run): parse và khớp quan hệ theo tên (ưu tiên trong file, sau đó mới tới DB). Trả lỗi và cảnh báo theo từng dòng (thiếu tên, trùng tên mơ hồ, vòng quan hệ).
- [ ] `POST /api/import/commit`: nhập thật trong một transaction, tính lại đời và lineage, ghi audit (một bản ghi tổng kèm số lượng).
- [ ] Chỉ Manager/Admin. Giới hạn 2.000 dòng. Test: file mẫu hợp lệ, dòng lỗi, trùng tên, rollback khi có lỗi.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tải file mẫu, điền 20 người có quan hệ cha/mẹ/vợ chồng.
2. Gọi preview: không có lỗi, số người khớp.
3. Cố ý nhập sai tên cha ở dòng 5: preview báo lỗi ở dòng 5.
4. Commit: cây hiện đủ 20 người, đúng đời.

**➡️ Đợt tiếp:** Đợt 41 — Import Excel FE · Model **Sonnet** · Effort **medium** · Skill: `ui-ux-pro-max`, `run`, `anthropic-skills:xlsx`
```text
Làm Đợt 41 — Import Excel FE theo roadmap/ROADMAP.md. Đọc CLAUDE.md, mục Đợt 41, roadmap/IDEA.md §6.9, docs/DECISIONS.md (mẫu Excel đã chốt ở Đợt 40), .claude/rules/frontend.md. Chạy npm run gen:api. Làm trình hướng dẫn nhập gồm 3 bước: tải mẫu → upload để xem trước (bảng lỗi theo dòng) → xác nhận nhập, sau đó hiện kết quả. Trước khi code UI, đọc docs/DESIGN.md và chỉ dùng token màu/font/spacing ở đó; thiết kế ưu tiên điện thoại, chữ nền ≥16px, đạt WCAG AA. Chạy app và kiểm tra màn hình ở khổ 375px và 1280px trước khi báo xong. Chỉ làm checklist Đợt 41. Xong khi `npm run lint` và `npm run build` pass. Khi xong: tick checkbox kèm ngày, đổi ⬜ thành ✅ + ngày, điền ✅ Đã làm, cập nhật 🔧/🧪, rồi DỪNG.
BẮT BUỘC gọi qua công cụ Skill các skill: ui-ux-pro-max, run, anthropic-skills:xlsx. Skill nào không gọi được thì dừng và báo tôi. Cuối phiên in bảng: skill | đã gọi (có/không).
```

---

### Đợt 41 — Import Excel FE ⬜
IDEA §6.9
- [ ] Trang "Nhập từ Excel" (chỉ Manager/Admin), trình hướng dẫn 3 bước có thanh tiến trình.
- [ ] Bước 2 hiện bảng xem trước, lọc được "chỉ dòng lỗi". Mỗi lỗi ghi số dòng và cách sửa. Còn lỗi thì không cho sang bước 3.
- [ ] Bước 3 xác nhận, sau đó hiện kết quả (số người đã thêm) và link sang trang Cây.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Tải mẫu từ trang, điền dữ liệu rồi upload: bảng xem trước hiện ra.
2. Upload file có lỗi: nút Tiếp bị khóa, lọc "chỉ dòng lỗi" hoạt động.
3. Sửa lỗi rồi nhập: có link sang Cây, và người mới hiện trên cây.
4. Ở khổ 375px: bảng xem trước cuộn ngang bên trong khung, trang không bị tràn.

**➡️ Đợt tiếp:** Hết lộ trình. Rà soát lại `roadmap/IDEA.md` §14 (việc còn chờ) và cân nhắc nâng cấp Capacitor + FCM (IDEA §9.6).
