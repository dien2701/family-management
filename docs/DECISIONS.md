# QUYẾT ĐỊNH KỸ THUẬT (chốt 2026-09-25)

> Bổ sung cho `roadmap/IDEA.md`, không thay thế IDEA.md. Nếu có chỗ khác với IDEA.md thì **file này thắng**.
> Cách chốt: người dùng chọn **"lấy toàn bộ khuyến nghị (KN)"** cho 50 câu hỏi làm rõ.
> Các câu mang nhãn **⏳ Chưa chốt** đang dùng giá trị tạm, đổi được mà không ảnh hưởng kiến trúc.

## A. Phiên bản và công cụ nền

1. **Spring Boot**: IDEA ghi 3.x, nhưng 3.5 đã hết hỗ trợ miễn phí (OSS) từ giữa 2026.
   → **Chốt: Spring Boot 4.1.x** (Spring Framework 7, springdoc 3.x). Java giữ bản 21 như IDEA.
2. **MySQL**: 8.0 đã hết hỗ trợ từ 04/2026.
   → **Chốt: MySQL 8.4 LTS** (có image ARM64).
3. **Công cụ build BE**: Maven hay Gradle?
   → **Chốt: Maven**, dùng Maven Wrapper (`mvnw`).
4. **Frontend và trình quản lý gói**
   → **Chốt:** dùng bản ổn định mới nhất lúc setup: React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, TanStack Query 5, React Router 7 (dạng thư viện, không dùng framework mode), React Hook Form, Zod 4, `@xyflow/react` 12, vite-plugin-pwa. Trình quản lý gói: **npm**. Node 24 LTS.
5. **Cấu trúc repo**
   → **Chốt:** monorepo `apps/backend` + `apps/frontend`, không dùng công cụ quản lý workspace.
6. **Tên package gốc và tên app**, ⏳ **Chưa chốt**. Tạm dùng:
   - package `vn.giapha`, groupId `vn.giapha`, artifactId `giapha-backend`;
   - tên hiển thị **"Tộc Phả"** (lấy từ tên miền ví dụ `giapha.duckdns.org`).

## B. Kiến trúc backend

7. **Ranh giới module**
   → **Chốt: Spring Modulith**, có test `ApplicationModules.verify()`. Module khác chỉ được gọi lớp public nằm ở **package gốc** của module, hoặc giao tiếp qua application event. Mọi subpackage là nội bộ.
8. **Bố cục trong module**
   → **Chốt:** phân lớp phẳng `controller/ service/ repository/ entity/ dto/ mapper/`. Facade công khai đặt ở package gốc, ví dụ `member/MemberFacade`.
9. **Lọc `family_id` và `locked`**
   → **Chốt:** viết tường minh trong repository (`findByIdAndFamilyId`, `...AndLockedFalse`). **Không dùng Hibernate `@Filter`**, vì filter không áp dụng cho `findById`. Mỗi module có test chặn truy cập chéo giữa các family.
10. **Kiểu ID**
    → **Chốt:** `BIGINT AUTO_INCREMENT`. Mã mời là chuỗi ngẫu nhiên riêng.
11. **Thời gian**
    → **Chốt:** lưu UTC (`DATETIME(6)` ↔ `Instant`), JVM chạy UTC. Chỉ quy đổi sang `Asia/Ho_Chi_Minh` ở tầng nghiệp vụ (nhắc lịch, reset AI lúc 0h, lịch âm). Ngày thuần (sinh, mất) lưu dạng số `year/month/day` như IDEA.
12. **Flyway**
    → **Chốt:** mỗi thay đổi là một file `V{n}__{mô_tả}.sql` mới, **không sửa file đã chạy**. Giai đoạn nào tạo bảng giai đoạn đó. Riêng các cột `locked`, `lock_source`, `lock_root_id`, `locked_by`, `locked_at` của `member` phải có ngay khi tạo bảng. Hibernate chạy `ddl-auto: validate`.
13. **Định dạng lỗi API**
    → **Chốt:** RFC 7807 `ProblemDetail`, thêm `errors: [{field, message}]` để frontend hiện lỗi tại đúng trường. Thông báo lỗi viết bằng tiếng Việt.
14. **Kiểu dữ liệu dùng chung BE↔FE**
    → **Chốt:** sinh kiểu TS từ OpenAPI (springdoc) bằng `openapi-typescript`, lệnh `npm run gen:api`, ra file `src/services/schema.d.ts`. Không viết tay kiểu DTO.

## C. Auth và bảo mật

15. **Google OAuth**
    → **Chốt:** frontend dùng Google Identity Services để lấy ID token, gửi lên `POST /api/auth/google`. Backend xác minh (aud, iss, exp) rồi phát JWT và refresh token của hệ thống. Không dùng `oauth2Login`.
16. **Email đã đăng ký bằng mật khẩu, sau đó đăng nhập bằng Google**
    → **Chốt:** tự liên kết (ghi `google_sub`), vì Google đã xác thực email. Tài khoản PENDING cũng chuyển sang ACTIVE.
17. **Lưu access token**
    → **Chốt:** chỉ giữ trong bộ nhớ. Khi tải lại trang thì gọi `POST /api/auth/refresh` bằng cookie. Refresh token đặt trong cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, xoay vòng sau mỗi lần refresh. DB chỉ lưu SHA-256 của token.
18. **Ký JWT**
    → **Chốt:** Spring Security OAuth2 Resource Server (Nimbus), HS256, khóa `JWT_SECRET`. Access token hiệu lực 15 phút, refresh token 30 ngày.
19. **Khóa sau 5 lần đăng nhập sai**
    → **Chốt:** đếm theo email, khóa 15 phút. Lưu trong bộ nhớ (Caffeine + bucket4j), chấp nhận mất khi restart vì chỉ chạy một instance. Rate limit cho OTP, đăng nhập và AI cũng dùng bucket4j.
20. **Mật khẩu và tài khoản chờ xác thực**
    → **Chốt:** mật khẩu tối thiểu 8 ký tự, không bắt buộc ký tự đặc biệt. BCrypt cost 12. Tài khoản PENDING không xác thực OTP sau **7 ngày** thì tự xóa bằng job hằng ngày. OTP lưu dạng hash, cùng bộ đếm `attempts`.
21. **Gửi OTP khi chưa có nhà cung cấp email**
    → **Chốt:** gửi qua interface `MailSender`.
    - Profile `dev` dùng `ConsoleMailSender`, in OTP ra log.
    - Prod tạm dùng SMTP (Gmail App Password hoặc Brevo miễn phí), cấu hình bằng biến môi trường `MAIL_*`.

## D. Nghiệp vụ (mâu thuẫn và chỗ trống)

22. **Admin và family**
    → **Chốt:** Admin **không thuộc family nào**. Trong khu quản trị, Admin chọn family để thao tác, mọi API nhận `familyId` từ ngữ cảnh đã chọn. AI của Admin chạy theo family đang chọn.
23. **Rời family và loại thành viên**
    → **Chốt:** User được tự rời family, Manager được loại User khỏi family. Cả hai trường hợp đều gỡ `member_id` và thu hồi refresh token. Manager chỉ rời được sau khi đã chuyển quyền.
24. **Mã mời**
    → **Chốt:** dùng được nhiều lần cho tới khi hết hạn (7 ngày), Manager thu hồi được. Người dùng mã thì **vào thẳng** family. Chỉ bước liên kết "Tôi là ai" mới cần Manager duyệt.
25. **`full_name`**
    → **Chốt:** "bắt buộc duy nhất" nghĩa là trường bắt buộc duy nhất, **không** có ràng buộc UNIQUE.
26. **Phụ nữ có nhiều chồng**
    → **Chốt:** thêm cột `marriage.husband_order`. Khi vẽ, các chồng xếp hai bên giống trường hợp nhiều vợ.
27. **`lineage`**
    → **Chốt:** hệ thống tự suy ra, Manager sửa tay được.
    - Con của nam NOI là NOI.
    - Con của nữ NOI là NGOAI.
    - Người thêm qua "+ Vợ/Chồng" là DAU_RE.
    - Con của NGOAI vẫn là NGOAI.
28. **Thêm tổ tiên phía trên Đời 01**
    → **Chốt:** đánh số lại toàn bộ đời, Đời 01 luôn là người cao nhất. Cho phép một family có **nhiều cây rời nhau**, mỗi cây tính đời riêng.
29. **Tiền tố Cụ/Ông/Bà**
    → **Chốt:** chỉ áp dụng cho member ở **đời cao hơn** người xem. Cách 2 đời là "Ông" hoặc "Bà" (theo `gender`), cách từ 3 đời trở lên là "Cụ". `prefix_override` luôn được ưu tiên.
30. **Ngày sinh âm**
    → **Chốt:** `birth_*` lưu theo lịch mà người dùng đã nhập (`birthday_calendar`). Thêm cột `birth_lunar_leap`.
31. **Chỉ biết ngày/tháng âm của ngày mất, không biết năm**
    → **Chốt:** cho phép. Để trống các trường ngày dương, và không hiện "giỗ lần thứ N".
32. **Chi (branch)**
    → **Chốt:** khi đặt `root_member_id`, hệ thống tự gán `branch_id` cho toàn bộ con cháu. Manager sửa tay từng người được.
33. **Chỗ lệch giữa các giai đoạn**
    a) Ở giai đoạn 1, User chỉ được xem, **ẩn menu thao tác** trên cây. Menu "Đề xuất…" có từ giai đoạn 2.
    b) **Ghi audit log ngay từ giai đoạn 1** (bảng và writer trong `common`). UI "Lịch sử thay đổi" làm ở giai đoạn 2.
    c) **Upload ảnh (avatar, ảnh bìa) có từ giai đoạn 1**: frontend upload thẳng lên Cloudinary bằng chữ ký do backend cấp. Backend ghi vào bảng `attachment` (thêm cột `kind` AVATAR|COVER|DOCUMENT) để tính quota 1 GB mỗi family.

## E. Frontend, cây, lịch âm, giao diện

34. **Xếp vị trí cây**
    → **Chốt:** backend chỉ trả đồ thị (nút và cạnh). Frontend xếp vị trí bằng hàm TS thuần (`src/features/tree/layout/`) có unit test. Bản in A3/A2/PNG xuất ngay ở frontend từ cùng layout đó.
35. **Lịch âm ở frontend**
    → **Chốt:** bản Java là nguồn chuẩn. Viết thêm bản TS của cùng thuật toán. Cả hai chạy chung bộ dữ liệu test `shared/fixtures/lunar/` (1900–2100).
36. **Giao diện**
    → **Chốt:** lấy phong cách từ `docs/theme.png` (chi tiết ở `docs/DESIGN.md`). Font **Be Vietnam Pro**, icon **lucide**. **Chưa làm dark mode**, chỉ có giao diện sáng.
37. **Ngôn ngữ**
    → **Chốt:** chuỗi tiếng Việt viết thẳng trong code, gom theo feature, không dùng thư viện i18n. Tên biến, hàm và commit viết bằng tiếng Anh. ⏳ **Ngôn ngữ comment chưa chốt**, tạm dùng **tiếng Việt, ngắn gọn**.
38. **Offline**
    → **Chốt:** PWA cache phần khung app, và cache NetworkFirst cho các `GET /api/**` đã xem (chỉ đọc offline). Không cache request ghi.

## F. Hạ tầng, deploy, CI, test

39. **Deploy**
    → **Chốt:** Docker Compose trên Oracle ARM, gồm `nginx`, `app`, `mysql` và certbot. Frontend build thành file tĩnh, nginx phục vụ cùng domain với `/api`, nên không phải xử lý CORS.
40. **Build image**
    → **Chốt:** GitHub Actions build image `linux/arm64`, đẩy lên GHCR, server `docker compose pull`.
41. **CI/CD**
    → **Chốt:**
    - Mỗi PR chạy BE `./mvnw verify`, FE `npm run lint` + `npm run build` + `npm test`.
    - Deploy thủ công bằng `workflow_dispatch` hoặc khi push tag `v*`.

    ⏳ **Quy trình git chưa chốt**, tạm dùng: mỗi đợt một nhánh `dot-NN-<ten>`, PR vào `main`. Remote GitHub là `dien2701`.
42. **Môi trường**
    → **Chốt:** chỉ có `dev` (máy cá nhân, MySQL chạy bằng Docker) và `prod`, không có staging.
43. **Sao lưu**
    → **Chốt:** `mysqldump` chạy bằng cron hằng ngày, đẩy lên Oracle Object Storage, giữ 30 ngày.
44. **Test backend**
    → **Chốt:** JUnit 5 + Testcontainers MySQL 8.4 (máy dev cần Docker), không dùng H2. Không đặt ngưỡng coverage cứng. **Bắt buộc có test cho:** lịch âm, xếp cây (FE), phân quyền, cách ly family, khóa nhánh.
45. **Test frontend**
    → **Chốt:** Vitest + Testing Library. Playwright E2E cho vài luồng chính (đăng ký, tạo family, thêm member), bắt đầu từ cuối giai đoạn 1.

## G. Thư viện giai đoạn 2–3

46. **Web Push**
    → **Chốt:** thử `nl.martijndwars:web-push` trước, cố định phiên bản BouncyCastle. Gặp lỗi thì chuyển sang tự cài VAPID và mã hóa payload bằng JDK + Nimbus.
47. **Gemini**
    → **Chốt:** SDK chính thức `com.google.genai`, đặt sau interface `AiProvider`. ⏳ **Chưa chốt**, tạm dùng: mỗi user **một luồng chat duy nhất**, lịch sử giữ **30 ngày**.
48. **Font PDF**
    → **Chốt:** nhúng Be Vietnam Pro (hoặc Noto Sans) vào OpenPDF để hiện đúng dấu tiếng Việt.

## H. File dự án và ROADMAP

49. **`AGENTS.md`** (của dự án khác)
    → **Chốt:** xóa, thay bằng `CLAUDE.md` và `.claude/rules/*`.
50. **ROADMAP**
    → **Chốt:** chia theo **đợt**. Mỗi đợt tối đa 1 module, vừa một phiên làm việc, và có kết quả chạy được. ⏳ **Chưa chốt:** nhân lực (tạm: 1 người) và mốc thời gian (chưa có), nên chưa ước lượng thời gian.

## I. Cấu trúc thư mục (chốt 2026-09-25, chi tiết ở `docs/STRUCTURE.md`)

51. **Backend theo ảnh "Backend Folder Structure"**
    → **Chốt:** module trước, lớp phẳng trong module. Thêm `config/` và `common/` ở gốc `vn.giapha`. Mỗi module có `controller/ service/ repository/ entity/ dto/ mapper/` (kèm `validator/`, `event/` khi cần). Không chuyển sang kiểu lớp-trước vì Modulith cần ranh giới theo module.
52. **Frontend theo ảnh "Frontend Folder Structure"**
    → **Chốt:** lai. Dùng tên thư mục như ảnh (`assets, components, layout, pages, features, hooks, context, services, utils`), **bỏ `redux/`** (giữ quyết định không dùng Redux). Thay đổi so với bản cũ: `api/` thành `services/` (chứa `client.ts`, `schema.d.ts`), `lib/` thành `utils/`, `app/` tách thành `layout/`, `pages/`, `context/`. `components/` chia `ui/` (shadcn) và `shared/`.
53. **Thư mục `.claude/` theo ảnh "Cấu trúc dự án Claude Code"**
    → **Chốt:** có `settings.json` kèm hook, `rules/`, `skills/` (dot-close, be-slice, fe-feature, flyway-migration), `agents/` (code-reviewer, test-writer, security-reviewer), và `.mcp.json` ở gốc (playwright, mysql-dev chỉ đọc). Viết ở Đợt 0.

## Việc còn chờ (từ IDEA.md)
- Nhà cung cấp email OTP chính thức.
- Mẫu file Excel để nhập: chốt ở đầu Đợt 40.
