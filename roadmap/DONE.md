# ROADMAP — Đợt đã xong (0–10)

> Lưu để tra cứu, không cần đọc mỗi phiên. Kế hoạch còn lại ở `roadmap/ROADMAP.md`.

# ĐÃ XONG — NỀN TẢNG (kế hoạch cũ, giữ để tra cứu)

### Đợt 0 — Nền tảng Backend ✅ 2026-09-25
IDEA §11 · DECISIONS #1–14, #39–44
- [x] `apps/backend`: dự án Maven, dùng Maven Wrapper, Java 21, Spring Boot 4.1.x (cố định bản patch). Các dependency: web, security, oauth2-resource-server, data-jpa, validation, flyway + flyway-mysql, mysql-connector-j, actuator, spring-modulith, mapstruct, springdoc 3.x, caffeine, bucket4j, testcontainers-mysql. ✅ 2026-09-25
- [x] Package `vn.giapha`, tạo 13 module rỗng (`auth family member tree calendar event proposal notification file ai report admin common`), mỗi module có `package-info.java`. ✅ 2026-09-25
- [x] `application.yml`, `application-dev.yml`, `application-prod.yml`, mọi bí mật đọc từ biến môi trường. JVM chạy UTC. Tạo `apps/backend/.env.example` liệt kê đủ các khóa (IDEA §11). ✅ 2026-09-25
- [x] `infra/docker-compose.dev.yml`: MySQL 8.4, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`, có volume. ✅ 2026-09-25
- [x] `V1__audit_log.sql` + module `common`: `AuditLogWriter`, `BusinessException`, `GlobalExceptionHandler` trả `ProblemDetail` kèm `errors[]`. ✅ 2026-09-25
- [x] `SecurityConfig` tạm: stateless, mở `/actuator/health`, `/v3/api-docs/**`, `/swagger-ui/**`, mọi đường dẫn khác bắt buộc đăng nhập. ✅ 2026-09-25
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

---

### Đợt 3 — Auth FE ✅ 2026-09-25
IDEA §6.1 · DECISIONS #15–17
- [x] Các trang: Đăng nhập, Đăng ký (có tick đồng ý điều khoản), Nhập OTP (đếm ngược 60 giây mới gửi lại được), Quên mật khẩu, rồi OTP, rồi Mật khẩu mới. ✅ 2026-09-25
- [x] Nút "Đăng nhập với Google" dùng Google Identity Services, gọi `/api/auth/google`. ✅ 2026-09-25
- [x] `AuthProvider`: access token chỉ giữ trong bộ nhớ. Khi tải trang thì gọi `/auth/refresh`. `client.ts` gắn Bearer, gặp 401 thì refresh một lần rồi thử lại. Có đăng xuất. ✅ 2026-09-25
- [x] Route guard và điều hướng sau đăng nhập: chưa có family vào `/bat-dau` (trang tạm), có family vào `/`, Admin vào `/quan-tri` (trang tạm). ✅ 2026-09-25
- [x] Lỗi trong `ProblemDetail.errors` hiện đúng dưới từng trường (RHF + Zod). ✅ 2026-09-25

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

---

### Đợt 4 — Dòng họ BE ✅ 2026-09-25
IDEA §3, §6.2 · DECISIONS #22–24
- [x] `V3__family.sql`: `family`, `family_invitation` (thêm `revoked_at`), `user_consent`. Phiên bản chính sách lấy từ cấu hình `app.policy.version`. ✅ 2026-09-25
- [x] Tạo family (chỉ cho user chưa có family), người tạo thành Manager, lưu consent. ✅ 2026-09-25
- [x] Mã mời: tạo (chuỗi ngẫu nhiên 8 ký tự + link), xem danh sách, thu hồi. Tham gia bằng mã (lưu consent) thì vào thẳng family. Báo lỗi riêng khi mã hết hạn hoặc đã bị thu hồi. ✅ 2026-09-25
- [x] Rời family (User), loại thành viên (Manager), chuyển quyền Manager. Manager chỉ rời được sau khi đã chuyển quyền. Mỗi thay đổi đều thu hồi refresh token của người bị ảnh hưởng. ✅ 2026-09-25
- [x] `GET /api/family`: thông tin family và danh sách tài khoản. Email chỉ hiện cho Manager và chính chủ. ✅ 2026-09-25
- [x] Facade `FamilyFacade`, để module khác đọc `familyId` và vai trò. ✅ 2026-09-25

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

---

### Đợt 6 — Lịch âm BE ✅ 2026-09-25
IDEA §7 · DECISIONS #11, #30, #31, #35
- [x] `calendar`: lớp `LunarCalendar` theo thuật toán Hồ Ngọc Đức, TZ +7. Làm các phép đổi dương sang âm, âm sang dương (có cờ nhuận), số ngày của tháng âm (29/30), tháng nhuận của năm. ✅ 2026-09-25
- [x] `AnniversaryRules`: xác định ngày giỗ trong năm âm Y. Thứ tự ưu tiên: ngày ghi đè, rồi tháng nhuận cúng tháng thường, rồi ngày 30 cúng 29. Sinh nhật âm và sự kiện âm dùng cùng quy tắc. Sinh nhật dương 29/2 dời sang 28/2. ✅ 2026-09-25
- [x] `shared/fixtures/lunar/`: file JSON đối chiếu gồm mùng 1 Tết 1900–2100, các tháng nhuận, và các ngày mẫu. **Lấy từ nguồn độc lập** (bảng của Hồ Ngọc Đức hoặc lịch chính thức), ghi nguồn vào `README.md`. ✅ 2026-09-25
- [x] Facade `CalendarFacade` và API: `GET /api/calendar/convert` (hai chiều), `GET /api/calendar/lunar-month-info`. ✅ 2026-09-25

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

---

# CHUẨN BỊ

### Đợt 8 — Tài khoản BE: Admin gốc, duyệt, consent ✅ 2026-09-25
IDEA §3, §5 · DECISIONS #55–57, #74
- [x] `V4__account_approval.sql`: thêm `approval_status` (NOT NULL, mặc định `WAITING`), `approved_by`, `approved_at` vào `user_account`. Cho phép `user_consent.family_id` NULL. Tài khoản đã có trong DB giữ `WAITING`. ✅ 2026-09-25
- [x] `ROOT_ADMIN_EMAIL` (`AppProperties`, `.env.example`): khi email này xác thực OTP, đăng nhập hoặc đăng nhập Google **mà hệ thống chưa có ADMIN nào** thì nâng thành `ADMIN` + `APPROVED`. Chống hai request song song cùng nâng (khóa hoặc UPDATE có điều kiện). ✅ 2026-09-25
- [x] JWT có thêm claim `approval`. Chặn mọi API nghiệp vụ với tài khoản chưa `APPROVED`, trả 403 ProblemDetail `ACCOUNT_NOT_APPROVED`. Ngoại lệ: `/api/auth/**`, `GET /api/me`, `POST /api/me/consent`. Thao tác ghi kiểm tra trạng thái từ DB, không chỉ tin claim. ✅ 2026-09-25
- [x] Consent: đăng ký bằng email lưu `user_consent` (family_id NULL, `app.policy.version`, IP). `GET /api/me` trả thêm `approvalStatus` và `consentRequired`. `POST /api/me/consent` lưu consent (dùng cho người đăng nhập Google lần đầu, hoặc khi đổi phiên bản chính sách). ✅ 2026-09-25
- [x] `/api/admin/accounts` (chỉ ADMIN) ✅ 2026-09-25:
  - `GET`: lọc theo trạng thái duyệt, trạng thái, vai trò; tìm theo tên hoặc email; phân trang.
  - `POST /{id}/approve`, `/reject`, `/lock`, `/unlock`, `/grant-admin`, `/revoke-admin`.
  - Admin không tự gỡ quyền và không tự khóa mình (`SELF_ACTION_FORBIDDEN`). Chặn gỡ quyền hoặc khóa Admin cuối cùng (`LAST_ADMIN`).
  - Từ chối, khóa và đổi vai trò đều thu hồi refresh token của người bị ảnh hưởng.
  - Ghi audit log (family_id NULL).
- [x] Module `family` giữ nguyên, sẽ gỡ ở Đợt 26. Endpoint family cũng yêu cầu tài khoản đã duyệt. ✅ 2026-09-25

**✅ Đã làm:** (2026-09-25, `.\mvnw.cmd verify` pass: 167 test)
- `V4__account_approval.sql`: `user_account` thêm `approval_status` (mặc định `WAITING`), `approved_by`, `approved_at`, index `idx_user_approval` và `idx_user_role`. `user_consent.family_id` cho phép NULL. FK `fk_consent_user` đổi sang `ON DELETE CASCADE` (đăng ký email lưu consent khi tài khoản còn PENDING, job dọn PENDING xóa user thì consent phải đi theo).
- `ROOT_ADMIN_EMAIL` (`app.root-admin-email`, `.env.example`): `RootAdminService.promoteIfRoot` chạy ở xác thực OTP, đăng nhập mật khẩu và đăng nhập Google. Chỉ nâng khi tài khoản ACTIVE và chưa có Admin **dùng được** nào (ACTIVE + APPROVED; Admin bị khóa/từ chối không tính). Khóa dòng tài khoản, đọc lại bằng đọc-khóa nên request song song chỉ nâng một lần; ghi audit `ROOT_ADMIN_PROMOTE`.
- JWT có claim `approval`. `ApprovalGateFilter` (sau `BearerTokenAuthenticationFilter`, khai báo trong `SecurityConfig`) chặn mọi API của tài khoản chưa APPROVED bằng 403 `ACCOUNT_NOT_APPROVED`, mặc định chặn (chỉ miễn `/api/auth/**`, `GET /api/me`, `POST /api/me/consent`). Request đọc tin claim, request ghi (POST/PUT/PATCH/DELETE) kiểm lại từ DB qua `AccountAccessLookup` (`AuthFacade` cài đặt): thêm `ACCOUNT_LOCKED` (403) và tài khoản đã xóa (401). Token cũ thiếu claim coi như chưa duyệt. Endpoint family cũng bị chặn.
- Consent: đăng ký email lưu `user_consent` (family_id NULL, phiên bản chính sách, IP), không nhân đôi khi đăng ký lại. `GET /api/me` (và `AuthResponse.user`) trả thêm `approvalStatus`, `consentRequired`. `POST /api/me/consent` body `{"acceptTerms": true}` lưu consent phiên bản hiện hành, gọi lại không ghi thêm.
- `/api/admin/accounts` (module `auth`, `@PreAuthorize("hasRole('ADMIN')")` + kiểm lại vai trò từ DB): `GET` lọc `approval`, `status`, `role`, `q` (họ tên không phân biệt hoa thường/dấu, hoặc email), phân trang `page`/`size` (tối đa 100), mới nhất trước, không hiện tài khoản PENDING; `POST /{id}/approve|reject|lock|unlock|grant-admin|revoke-admin`. Mọi thao tác khóa toàn bộ dòng Admin theo thứ tự id rồi mới khóa người bị tác động (không deadlock, hai Admin gỡ nhau song song chỉ một cái thành công). Lỗi: `SELF_ACTION_FORBIDDEN`, `LAST_ADMIN`, `INVALID_ACCOUNT_STATE` (đều 409), `ACCOUNT_NOT_FOUND` (404). Reject/lock/grant/revoke thu hồi refresh token. Audit log `family_id` NULL, before/after chỉ có vai trò và trạng thái (không email).
- Ma trận trạng thái (đã hỏi và chốt): approve từ WAITING/REJECTED; reject từ WAITING/APPROVED; lock chỉ ACTIVE, unlock chỉ LOCKED; grant-admin chỉ tài khoản ACTIVE+APPROVED đang là USER; revoke-admin chỉ khi đang là Admin. Reject/lock Admin được phép (trừ chính mình và Admin cuối cùng), vai trò giữ nguyên.
- Module `family` giữ nguyên (gỡ ở Đợt 26). Test cũ (`AuthApiTest`, `FamilyApiTest`, `CalendarApiTest`) sửa cho khớp cổng duyệt.
- Test mới: `AccountApprovalApiTest` (19), `AdminAccountApiTest` (15), `LastAdminGuardTest` (4), helper `support/AccountFixtures`. `application-test.yml` đặt `root-admin-email: root.admin@giapha.test`.
- Skill: `security-review` không có lỗ hổng nào đạt ngưỡng báo. `code-review` có 4 ghi chú: sửa 2 (Admin gốc chỉ tính Admin dùng được; bỏ tham số thừa ở `acceptConsent`), 2 giữ nguyên theo thiết kế (request đọc tin claim ≤15 phút theo DECISIONS #56; khóa cả dòng Admin cho mọi thao tác để tránh deadlock).
- Ghi chú cho đợt sau: (1) `LAST_ADMIN` qua API gần như không chạm tới vì người gọi luôn là Admin còn lại, nên luật được kiểm bằng unit test và test hai Admin gỡ nhau song song; (2) request đọc của tài khoản vừa bị khóa/từ chối còn dùng được tới khi access token hết hạn (tối đa 15 phút), muốn cắt ngay thì cho `accessOf()` chạy cả request đọc; (3) Đợt 9 cần đưa `MeResponse` (thêm `approvalStatus`, `consentRequired`), `PageResponse`, `AccountAdminResponse` và các mã lỗi mới vào `openapi.yaml`.

**🔧 Setup thủ công cần làm:** Điền `ROOT_ADMIN_EMAIL=<email của bạn>` vào `apps/backend/.env` (đã thêm mẫu vào `.env.example`, chưa sửa `.env` thật). Chạy lại backend để Flyway áp dụng V4: các tài khoản đã có trong DB dev sẽ ở `WAITING`. Nếu chính email của bạn đã có tài khoản và trong DB chưa có Admin, chỉ cần đăng nhập lại là được nâng.

**🧪 Test thủ công (từng bước):**
1. Đăng ký bằng đúng `ROOT_ADMIN_EMAIL` và nhập OTP. Gọi `GET /api/me`: phải thấy `systemRole=ADMIN`, `approvalStatus=APPROVED`.
2. Đăng ký user B, nhập OTP. `GET /api/me` của B: `approvalStatus=WAITING`. B gọi `GET /api/calendar/convert?solar=2026-02-17`: nhận 403 `ACCOUNT_NOT_APPROVED`.
3. Admin gọi `GET /api/admin/accounts?approval=WAITING`: có B. Duyệt B. B refresh rồi gọi lại API lịch: nhận 200.
4. Admin cấp quyền Admin cho B, rồi thử tự gỡ quyền của chính mình: bị chặn. B gỡ quyền Admin của A: thành công. B thử tự gỡ quyền của mình khi chỉ còn B là Admin: bị chặn.
5. Khóa một User: refresh của người đó bị từ chối, đăng nhập lại cũng bị từ chối.

---

# GIAI ĐOẠN A — FRONTEND (CHẾ ĐỘ GIẢ LẬP)

### Đợt 9 — Hợp đồng API, dữ liệu 28 người, lớp giả lập ✅ 2026-09-25
IDEA §4, §11, Phụ lục A · DECISIONS #68, #70–72
- [x] `shared/api/openapi.yaml` (OpenAPI 3.1): ✅ 2026-09-25
  - Khởi tạo từ `/v3/api-docs` hiện tại (auth, me, calendar, admin/accounts của Đợt 8). **Bỏ** `/api/family/**`.
  - Có schema `ProblemDetail` dùng chung, và `MemberSummary`, `MemberDetail`, `MemberPage`.
  - Thêm `GET /api/members` (tham số `q`, `sort`, `ageMin`, `ageMax`, `generation`, `deceased`, `onTree`, `page`, `size`) và `GET /api/members/{id}`.
  - Chạy `@redocly/cli lint` pass (script `npm run lint:api`).
- [x] `gen:api` đọc `../../shared/api/openapi.yaml` (không cần backend chạy). Chạy lại để sinh `schema.d.ts`. Sửa những chỗ đang dùng kiểu family trong `schema.d.ts` (nếu build vỡ thì chỉ gỡ phần import, còn phần UI dòng họ để Đợt 10 gỡ). ✅ 2026-09-25
- [x] `shared/fixtures/seed/members.json`: ✅ 2026-09-25
  - Đúng 28 người theo IDEA Phụ lục A, giữ họ tên nguyên văn.
  - Có `deathLunar{day,month,leap:false,year?}`, và `deathSolar` được tính bằng `utils/lunar` khi có năm.
  - Mọi người có `isDeceased: true` và cùng nơi an táng. Các trường khác để trống.
  - Kèm `README.md` ghi nguồn và quy ước.
  - Có Vitest kiểm tra: đủ 28 người, khớp Phụ lục A, và `deathSolar` khớp lịch âm.
- [x] `src/services/mock/`: ✅ 2026-09-25
  - `router` (method + mẫu path → handler).
  - `store` trong localStorage (key `giapha.mock.v1`), lần đầu khởi tạo từ `members.json`.
  - Helper tạo `ProblemDetail`, phân trang, tìm không dấu (dùng chung `utils/text`), và vai trò người dùng lấy từ `/api/me` thật.
  - Handler được phép **bọc** endpoint thật: gọi backend rồi bổ sung dữ liệu từ store.
- [x] `client.ts`: ở chế độ giả lập, request có handler thì chạy handler (có trễ nhỏ để thấy trạng thái đang tải), không có handler thì gọi backend thật. Module mock được import động theo `import.meta.env.VITE_API_MODE`. Có test đảm bảo bản build prod không chứa mã mock. ✅ 2026-09-25
- [x] Handler `GET /api/members` và `GET /api/members/{id}`: ✅ 2026-09-25
  - tìm không dấu, lọc, sắp xếp, phân trang;
  - `generation` và `onTree` lấy từ store cây (lúc này còn trống);
  - SĐT và email chỉ trả cho Admin và chính chủ.
- [x] Trang Thêm có mục "Dữ liệu tạm" (chỉ hiện ở chế độ giả lập), gồm: ✅ 2026-09-25
  - banner "Dữ liệu đang lưu tạm trên trình duyệt này";
  - nút **"Tải dữ liệu tạm (JSON)"** để giữ lại dữ liệu đã nhập cho Đợt 39;
  - nút **"Khôi phục dữ liệu gốc"** (có hộp xác nhận).
- [x] `apps/frontend/.env.example` thêm `VITE_API_MODE`. Thêm script `dev:mock`. ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. `npm run lint`, `npm run build`, `npm test` (147 test, gồm 40 test mới) và `npm run lint:api` đều pass. Theo yêu cầu của người dùng, **không chạy thử giao diện ở 375px và 1280px** (chưa xem mục "Dữ liệu tạm" bằng mắt); chỉ kiểm bằng test và bản build prod thật.
- `shared/api/openapi.yaml` (OpenAPI 3.1, `shared/api/redocly.yaml` cho `lint:api`): khởi tạo từ `/v3/api-docs` của backend Đợt 8, bỏ `/api/family/**`, thêm `ProblemDetail`/`FieldError`, các response dùng chung (`application/problem+json`), `GET /api/members`, `GET /api/members/{id}`, `MemberSummary`, `MemberDetail`, `MemberPage`. `gen:api` đọc file này (không cần backend chạy). `@redocly/cli` 2.54.3 thêm vào devDependencies.
- `shared/fixtures/seed/members.json` (+ `README.md`): đúng 28 người, thứ tự Phụ lục A, họ tên nguyên văn, chỉ có `fullName`, `isDeceased`, `deathLunar`, `deathSolar` (21 người có năm), `burialPlace`. Test `seed.test.ts` đọc lại bảng Phụ lục A trong `roadmap/IDEA.md` để so, và kiểm `deathSolar` bằng `utils/lunar`.
- `src/services/mock/`: `router`, `store` (localStorage `giapha.mock.v1`, khởi tạo từ seed, có `resetStore`/`exportStoreJson`), `problem`, `paging`, `context`, `handlers/members.ts`. `client.ts` chạy handler nếu có, không thì gọi backend thật; vai trò lấy từ `/api/me` thật. Điều kiện `import.meta.env.DEV && VITE_API_MODE === 'mock'` nên bản build prod không chứa mã mock (test `prodBuild.test.ts` build thật với `VITE_API_MODE=mock` rồi tìm chuỗi; đã tự kiểm bằng `npm run build` thật).
- `GET /api/members` (tìm không dấu, lọc tuổi/đời/đã mất/trên cây, sắp xếp, phân trang, 400 khi tham số sai) và `GET /api/members/{id}` (404 `MEMBER_NOT_FOUND`, SĐT/email chỉ cho Admin và chính chủ, tài khoản chưa duyệt 403 `ACCOUNT_NOT_APPROVED`).
- Trang Thêm có mục "Dữ liệu tạm" (`features/mockdata`, chỉ ở chế độ giả lập): banner, "Tải dữ liệu tạm (JSON)", "Khôi phục dữ liệu gốc" (có hộp xác nhận).
- `.env.example` thêm `VITE_API_MODE`; script `dev:mock` (`scripts/dev-mock.mjs`, chạy được cả PowerShell lẫn bash); `utils/text.ts` (bỏ dấu); `types/env.d.ts`.
- Skill: `code-review` (medium) báo 4 điểm, đã sửa 3 (hợp đồng ghi nhầm 401 cho `verify-otp`, mô tả lọc tuổi mơ hồ, kho giả lập giữ bản cũ trong bộ nhớ sau khi xóa localStorage), 1 giữ nguyên có chủ đích (`legacyTypes.ts`).
- Khác dự kiến / quyết định đã tự chọn (chưa có trong đặc tả): (1) `MeResponse` còn `familyId`, `familyRole`, `hideMaternalLine` ở dạng `deprecated` vì backend Đợt 8 còn trả và UI dòng họ còn dùng tới Đợt 10; backend bỏ ở Đợt 26. (2) `features/family/legacyTypes.ts` là kiểu viết tay tạm để build không vỡ, Đợt 10 gỡ cùng cả feature. (3) Fixture không có `id`: id là số thứ tự 1–28 theo Phụ lục A, cả FE và BE (Đợt 27) gán theo thứ tự này. (4) `sort` nhận `name`, `age` (lớn tuổi trước), `created` (mới thêm trước), `generation`; sắp tên theo cả chuỗi họ tên (`localeCompare('vi')`). (5) Tuổi tính theo năm sinh, người đã mất tính đến năm mất dương; thiếu năm sinh hoặc năm mất thì bị loại khi lọc tuổi. (6) `deathSolar` luôn có `year`; `deathLunar.year` có thể `null`. (7) `dev:mock` dùng script Node vì `.env.mock` bị `.gitignore` (`.env.*`). (8) `vite.config.ts` thêm `server.fs.allow: ['../..']` (đọc fixture ngoài `apps/frontend`) và `test.env.VITE_API_MODE = ''`. (9) `ProblemDetail`/`FieldError` trong `client.ts` nay lấy từ `schema.d.ts`.
- Việc nên làm thêm (chưa làm, ngoài phạm vi): mỗi lần gọi handler mock lại gọi thêm `/api/me` thật (chưa cache); kho giả lập không đồng bộ giữa nhiều tab; test `seed.test.ts` đọc `roadmap/IDEA.md` nên cần chạy trong bản checkout đầy đủ của repo.

**🔧 Setup thủ công cần làm:** `npm install` (có thêm `@redocly/cli`). Chạy backend dev như cũ (cần một tài khoản đã duyệt để đăng nhập; nhớ đặt `ROOT_ADMIN_EMAIL` trong `apps/backend/.env`). Chế độ giả lập chạy bằng `npm run dev:mock`.

**🧪 Test thủ công (từng bước):**
1. `npm run gen:api` khi **tắt** backend: vẫn sinh được `schema.d.ts`.
2. `npm run dev:mock` (ở `apps/frontend`), đăng nhập bằng tài khoản đã duyệt. Trong DevTools Console gọi `GET /api/members?q=nguyen van` qua app (hoặc xem tab Network): có các "Nguyễn Văn…".
3. Thêm > Dữ liệu tạm: bấm "Khôi phục dữ liệu gốc": localStorage `giapha.mock.v1` được tạo lại với 28 người.
4. `npm run build`, rồi tìm chuỗi `giapha.mock` trong `dist`: không có.

---

### Đợt 10 — FE tài khoản: gỡ dòng họ, chờ duyệt, quản lý tài khoản ✅ 2026-09-25
IDEA §3, §5, §6.10 · DECISIONS #54–57
- [x] Gỡ `features/family`, các trang `/bat-dau`, `/moi/:code`, `/them/dong-ho` và mục "Dòng họ" trong trang Thêm. Gỡ các test liên quan. Không còn chỗ nào đọc `familyId` hoặc `familyRole`. ✅ 2026-09-25
- [x] Route guard mới theo `approvalStatus` của `/api/me`: WAITING vào `/cho-duyet`, REJECTED vào `/khong-duoc-duyet`, APPROVED vào app. Bỏ khu `/quan-tri` riêng: Admin dùng chung AppShell, và có thêm mục **"Quản trị"** (sidebar, rail, trang Thêm). Toàn bộ route `/quan-tri/**` có guard chỉ cho Admin. ✅ 2026-09-25
- [x] `/cho-duyet`: ✅ 2026-09-25
  - giải thích ngắn;
  - nếu `consentRequired` thì bắt tick đồng ý (có link chính sách) và gọi `POST /api/me/consent`;
  - tự gọi `/api/me` mỗi 30 giây và khi cửa sổ được focus lại, được duyệt thì refresh rồi vào Tổng quan;
  - có nút Đăng xuất.
- [x] `/khong-duoc-duyet`: thông báo và nút Đăng xuất. ✅ 2026-09-25
- [x] Quản trị > **Tài khoản** (backend thật): ✅ 2026-09-25
  - tab "Chờ duyệt" (có badge số) và tab "Tất cả";
  - ô tìm, lọc trạng thái và vai trò;
  - hiện dạng thẻ trên điện thoại, dạng bảng trên máy tính.
  - Hành động: Duyệt, Từ chối, Khóa, Mở khóa, Cấp Admin, Gỡ Admin, đều qua `ConfirmDialog`.
  - Lỗi `LAST_ADMIN` và `SELF_ACTION_FORBIDDEN` hiện đúng thông báo. Không hiện nút tự gỡ quyền hoặc tự khóa trên dòng của chính mình.
- [x] Trang Chính sách bảo mật: sửa nội dung, bỏ phần dòng họ, nêu rõ "một gia phả chung, Admin duyệt tài khoản". ✅ 2026-09-25

**✅ Đã làm:** 2026-09-25. Gỡ hẳn `features/family`, `AdminHomePage`, các route `/bat-dau`, `/moi/:code`, `/them/dong-ho` (giờ là 404) và mục Dòng họ ở trang Thêm; không còn chỗ nào của FE đọc `familyId`/`familyRole`. Route guard theo `approvalStatus`: WAITING → `/cho-duyet`, REJECTED → `/khong-duoc-duyet`, APPROVED → app; Admin dùng chung AppShell, mục **Quản trị** có ở sidebar, rail và trang Thêm, `/quan-tri/**` chỉ cho Admin (User bị đưa về Tổng quan). Trang Chờ duyệt (hỏi `/api/me` mỗi 30 giây và khi focus, được duyệt thì đổi token rồi vào Tổng quan; bắt tick đồng ý qua `POST /api/me/consent` khi `consentRequired`; có nút Kiểm tra lại và Đăng xuất) và trang Không được duyệt. Quản trị > Tài khoản chạy trên backend thật: tab Chờ duyệt (badge số) và Tất cả, tìm (debounce), lọc trạng thái/vai trò, phân trang, thẻ trên điện thoại và bảng ≥768px, sáu thao tác qua `ConfirmDialog`, lỗi `LAST_ADMIN`, `SELF_ACTION_FORBIDDEN`, `INVALID_ACCOUNT_STATE` hiện đúng thông báo, dòng của chính mình không có nút tự gỡ quyền/tự khóa. Viết lại Chính sách bảo mật (một gia phả chung, Admin duyệt). Kết quả: `npm run lint` 0 lỗi, `npm run build` pass, `npm test` 174 test pass (20 file, chạy 5 lần liền không flaky), `npm run lint:api` hợp lệ. Đã chạy thật ở chế độ giả lập với backend dev + MySQL Docker: đăng ký + OTP, chờ duyệt, Admin duyệt thì trang tự vào Tổng quan trong ~20 giây, từ chối, khóa và lọc "Bị khóa", User gõ thẳng `/quan-tri/tai-khoan` bị chặn; kiểm tra ở 375px và 1280px, không cuộn ngang, chữ nền 16px. Đã gọi `ui-ux-pro-max`, `run`, `security-review`; rà bảo mật phần FE của đợt không có phát hiện đáng kể (xem "Khác dự kiến").
- File chính: `apps/frontend/src/features/auth/{routing.ts,hooks.ts,components/{guards,ApprovalStatusCard,ConsentForm,ConsentCheckbox}.tsx,pages/{WaitingApprovalPage,RejectedPage,PolicyPage}.tsx,policyContent.ts}`, `src/features/admin/{api,hooks,accountRules,useAccountParams}.ts`, `src/features/admin/{components/*,pages/AccountsPage.tsx}`, `src/pages/routes.tsx`, `src/pages/MorePage.tsx`, `src/layout/{Sidebar,BottomNav,navItems}`, `src/context/{AuthProvider.tsx,authContext.ts}` (thêm `updateUser`), `src/components/{shared/Badge,shared/Pagination,ui/select}.tsx`, `src/test/setup.ts` (polyfill `<dialog>` cho jsdom).
- Khác dự kiến: (1) `Me.familyId`, `familyRole`, `hideMaternalLine` vẫn nằm trong `openapi.yaml` (đánh dấu `deprecated`) vì backend còn trả tới Đợt 26; FE không đọc nữa. (2) `POLICY_VERSION` giữ `1.0` dù nội dung đã đổi, vì backend đọc `app.policy.version` = `1.0` và chưa có API trả phiên bản: tăng cả hai bên cùng lúc (Đợt 26/32). (3) Tài khoản bị từ chối không tự kiểm tra lại: lúc từ chối backend đã thu hồi refresh token nên khi được duyệt lại người đó phải đăng nhập lại. (4) Tab Chờ duyệt chỉ có Duyệt/Từ chối; "Từ chối" tài khoản đã duyệt (backend cho phép) không đưa lên giao diện, dùng Khóa thay. (5) Thanh dưới trên điện thoại giữ đúng 5 mục nên Quản trị vào từ trang Thêm (mục Thêm sáng khi đang ở `/quan-tri/**`). (6) `/quan-tri` chuyển thẳng sang `/quan-tri/tai-khoan`; Đợt 23 sẽ thành trang tổng hợp. (7) Thêm `Badge`, `Pagination`, `Select` dùng chung vì Đợt 11 (danh sách thành viên) và Đợt 23 cần. (8) Chạy thử: `.env` cục bộ của máy đang trỏ tới MySQL cài sẵn (cổng 3306) nên khi chạy backend phải ép `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD` bằng biến môi trường tới container Docker dev (cổng 3307).
- Việc nên làm thêm (chưa làm, ngoài phạm vi): đưa "thành viên đang liên kết", "Gán thành viên", "Hủy liên kết" vào từng dòng tài khoản (Đợt 13 và 28); test E2E luồng duyệt bằng Playwright (Đợt 40); nút Đăng nhập Google chưa kiểm chứng thật vì máy chưa có `GOOGLE_CLIENT_ID` (nhánh `consentRequired` đã có test Vitest).

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Đăng ký user mới, nhập OTP: phải vào `/cho-duyet`.
2. Mở cửa sổ khác bằng tài khoản Admin, vào Quản trị > Tài khoản > Chờ duyệt, bấm Duyệt. Trong vòng 30 giây, cửa sổ user tự vào Tổng quan.
3. Đăng nhập Google bằng tài khoản mới: trang chờ duyệt bắt tick đồng ý.
4. Từ chối một tài khoản: người đó thấy `/khong-duoc-duyet`.
5. User gõ thẳng `/quan-tri/tai-khoan`: bị chặn. Không còn đường nào dẫn tới trang Dòng họ.
6. Kiểm tra ở khổ 375px và 1280px.

---
