# QUYẾT ĐỊNH KỸ THUẬT (chốt 2026-09-25, đổi hướng v2 cùng ngày)

> Bổ sung cho `roadmap/IDEA.md` (bản chốt v2), không thay thế IDEA.md. Nếu có chỗ khác với IDEA.md thì **file này thắng**.
> **Mục J (#54–#74) là đổi hướng v2** và thắng mọi mục trước nó. **Mục K (#75–#78) là điều chỉnh "hồ sơ tự quản"**, thắng mục J khi mâu thuẫn. **Mục L (#79–#83) là tài khoản ≠ thành viên, liên kết và chia việc Claude Code / Antigravity**, thắng mục K khi mâu thuẫn. **Mục M (#84) là tiết kiệm token: bỏ test mới và review**, thắng mọi mục trước. Quyết định cũ không còn đúng được đánh dấu **❌ Hủy** hoặc **🔁 Thay bằng #N**, giữ lại để tra lịch sử.
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
9. ❌ **Hủy (thay bằng #54, #58).** **Lọc `family_id` và `locked`**
   → **Chốt:** viết tường minh trong repository (`findByIdAndFamilyId`, `...AndLockedFalse`). **Không dùng Hibernate `@Filter`**, vì filter không áp dụng cho `findById`. Mỗi module có test chặn truy cập chéo giữa các family.
10. **Kiểu ID**
    → **Chốt:** `BIGINT AUTO_INCREMENT`. (Mã mời đã bỏ theo #63.)
11. **Thời gian**
    → **Chốt:** lưu UTC (`DATETIME(6)` ↔ `Instant`), JVM chạy UTC. Chỉ quy đổi sang `Asia/Ho_Chi_Minh` ở tầng nghiệp vụ (nhắc lịch, reset AI lúc 0h, lịch âm). Ngày thuần (sinh, mất) lưu dạng số `year/month/day` như IDEA.
12. **Flyway**
    → **Chốt:** mỗi thay đổi là một file `V{n}__{mô_tả}.sql` mới, **không sửa file đã chạy**. Giai đoạn nào tạo bảng giai đoạn đó. ~~Riêng các cột `locked`… của `member` phải có ngay khi tạo bảng.~~ (❌ bỏ theo #63.) Hibernate chạy `ddl-auto: validate`.
13. **Định dạng lỗi API**
    → **Chốt:** RFC 7807 `ProblemDetail`, thêm `errors: [{field, message}]` để frontend hiện lỗi tại đúng trường. Thông báo lỗi viết bằng tiếng Việt.
14. 🔁 **Thay bằng #70.** **Kiểu dữ liệu dùng chung BE↔FE**
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

22. ❌ **Hủy (thay bằng #54, #55).** **Admin và family**
    → **Chốt:** Admin **không thuộc family nào**. Trong khu quản trị, Admin chọn family để thao tác, mọi API nhận `familyId` từ ngữ cảnh đã chọn. AI của Admin chạy theo family đang chọn.
23. ❌ **Hủy (#54).** **Rời family và loại thành viên**
    → **Chốt:** User được tự rời family, Manager được loại User khỏi family. Cả hai trường hợp đều gỡ `member_id` và thu hồi refresh token. Manager chỉ rời được sau khi đã chuyển quyền.
24. ❌ **Hủy (#54, #63).** **Mã mời**
    → **Chốt:** dùng được nhiều lần cho tới khi hết hạn (7 ngày), Manager thu hồi được. Người dùng mã thì **vào thẳng** family. Chỉ bước liên kết "Tôi là ai" mới cần Manager duyệt.
25. **`full_name`**
    → **Chốt:** "bắt buộc duy nhất" nghĩa là trường bắt buộc duy nhất, **không** có ràng buộc UNIQUE.
26. 🔁 **Thay bằng #60** (vợ/chồng là ô `tree_spouse`). **Phụ nữ có nhiều chồng**
    → **Chốt:** thêm cột `marriage.husband_order`. Khi vẽ, các chồng xếp hai bên giống trường hợp nhiều vợ.
27. ❌ **Hủy (#63).** **`lineage`**
    → **Chốt:** hệ thống tự suy ra, Manager sửa tay được.
    - Con của nam NOI là NOI.
    - Con của nữ NOI là NGOAI.
    - Người thêm qua "+ Vợ/Chồng" là DAU_RE.
    - Con của NGOAI vẫn là NGOAI.
28. 🔁 **Thay bằng #60** (đời = độ sâu trên cây dựng tay). **Thêm tổ tiên phía trên Đời 01**
    → **Chốt:** đánh số lại toàn bộ đời, Đời 01 luôn là người cao nhất. Cho phép một family có **nhiều cây rời nhau**, mỗi cây tính đời riêng.
29. ❌ **Hủy (#58, #63).** **Tiền tố Cụ/Ông/Bà**
    → **Chốt:** chỉ áp dụng cho member ở **đời cao hơn** người xem. Cách 2 đời là "Ông" hoặc "Bà" (theo `gender`), cách từ 3 đời trở lên là "Cụ". `prefix_override` luôn được ưu tiên.
30. **Ngày sinh âm**
    → **Chốt:** `birth_*` lưu theo lịch mà người dùng đã nhập (`birthday_calendar`). Thêm cột `birth_lunar_leap`.
31. **Chỉ biết ngày/tháng âm của ngày mất, không biết năm**
    → **Chốt:** cho phép. Để trống các trường ngày dương, và không hiện "giỗ lần thứ N".
32. ❌ **Hủy (#63).** **Chi (branch)**
    → **Chốt:** khi đặt `root_member_id`, hệ thống tự gán `branch_id` cho toàn bộ con cháu. Manager sửa tay từng người được.
33. 🔁 **Thay bằng #64 (a), #63 (b: bỏ UI lịch sử, vẫn ghi audit), #67 (c: quota toàn hệ thống).** **Chỗ lệch giữa các giai đoạn**
    a) Ở giai đoạn 1, User chỉ được xem, **ẩn menu thao tác** trên cây. Menu "Đề xuất…" có từ giai đoạn 2.
    b) **Ghi audit log ngay từ giai đoạn 1** (bảng và writer trong `common`). UI "Lịch sử thay đổi" làm ở giai đoạn 2.
    c) **Upload ảnh (avatar, ảnh bìa) có từ giai đoạn 1**: frontend upload thẳng lên Cloudinary bằng chữ ký do backend cấp. Backend ghi vào bảng `attachment` (thêm cột `kind` AVATAR|COVER|DOCUMENT) để tính quota 1 GB mỗi family.

## E. Frontend, cây, lịch âm, giao diện

34. **Xếp vị trí cây** (vẫn đúng, đồ thị giờ là các ô của cây dựng tay theo #60)
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
44. 🔁 **Thay bằng #84** (phần test bắt buộc). **Test backend**
    → **Chốt:** JUnit 5 + Testcontainers MySQL 8.4 (máy dev cần Docker), không dùng H2. Không đặt ngưỡng coverage cứng. **Bắt buộc có test cho:** lịch âm, xếp cây (FE), phân quyền. (Cách ly family và khóa nhánh ❌ bỏ, thay bằng #74.)
45. 🔁 **Thay bằng #84** (bỏ E2E). **Test frontend**
    → **Chốt:** Vitest + Testing Library. Playwright E2E cho vài luồng chính, chạy ở Đợt 40 sau khi nối BE thật (luồng cụ thể ở ROADMAP, thay cho "tạo family").

## G. Thư viện giai đoạn 2–3

46. **Web Push**
    → **Chốt:** thử `nl.martijndwars:web-push` trước, cố định phiên bản BouncyCastle. Gặp lỗi thì chuyển sang tự cài VAPID và mã hóa payload bằng JDK + Nimbus.
47. **Gemini**
    → **Chốt:** SDK chính thức `com.google.genai`, đặt sau interface `AiProvider`. ⏳ **Chưa chốt**, tạm dùng: mỗi user **một luồng chat duy nhất**, lịch sử giữ **30 ngày**.
48. **Font PDF**
    → **Chốt:** nhúng Be Vietnam Pro (hoặc Noto Sans) vào OpenPDF để hiện đúng dấu tiếng Việt.

## H. File dự án và ROADMAP

49. 🔁 **Thay bằng #83** (có `AGENTS.md` mới cho Antigravity, chỉ dẫn tới `CLAUDE.md`). **`AGENTS.md`** (của dự án khác)
    → **Chốt:** xóa, thay bằng `CLAUDE.md` và `.claude/rules/*`.
50. 🔁 **Thứ tự đợt thay bằng #69.** **ROADMAP**
    → **Chốt:** chia theo **đợt**. Mỗi đợt tối đa 1 module, vừa một phiên làm việc, và có kết quả chạy được. ⏳ **Chưa chốt:** nhân lực (tạm: 1 người) và mốc thời gian (chưa có), nên chưa ước lượng thời gian.

## I. Cấu trúc thư mục (chốt 2026-09-25, chi tiết ở `docs/STRUCTURE.md`)

51. **Backend theo ảnh "Backend Folder Structure"**
    → **Chốt:** module trước, lớp phẳng trong module. Thêm `config/` và `common/` ở gốc `vn.giapha`. Mỗi module có `controller/ service/ repository/ entity/ dto/ mapper/` (kèm `validator/`, `event/` khi cần). Không chuyển sang kiểu lớp-trước vì Modulith cần ranh giới theo module.
52. **Frontend theo ảnh "Frontend Folder Structure"**
    → **Chốt:** lai. Dùng tên thư mục như ảnh (`assets, components, layout, pages, features, hooks, context, services, utils`), **bỏ `redux/`** (giữ quyết định không dùng Redux). Thay đổi so với bản cũ: `api/` thành `services/` (chứa `client.ts`, `schema.d.ts`), `lib/` thành `utils/`, `app/` tách thành `layout/`, `pages/`, `context/`. `components/` chia `ui/` (shadcn) và `shared/`.
53. **Thư mục `.claude/` theo ảnh "Cấu trúc dự án Claude Code"**
    → **Chốt:** có `settings.json` kèm hook, `rules/`, `skills/` (dot-close, be-slice, fe-feature, flyway-migration), `agents/` (code-reviewer, test-writer, security-reviewer), và `.mcp.json` ở gốc (playwright, mysql-dev chỉ đọc). Viết ở Đợt 0.

## J. Đổi hướng v2 (chốt 2026-09-25, qua 4 vòng hỏi đáp với người dùng)

54. **Bỏ dòng họ (Family)**
    → **Chốt:** hệ thống chỉ có **một gia phả chung**, không còn tenant. Không có `family_id` ở bất kỳ bảng nghiệp vụ nào.
    - Frontend gỡ phần dòng họ ở Đợt 10: `/bat-dau`, `/moi/:code`, trang Dòng họ.
    - Backend gỡ module `family` ở Đợt 26. Việc gỡ gồm: xóa code, một file Flyway V mới xóa bảng `family` và `family_invitation`, bỏ cột `family_id` và `family_role` của `user_account`, bỏ claim `familyId` và `familyRole`. Không sửa V3.
55. **Vai trò và Admin**
    → **Chốt:** chỉ có `ADMIN` và `USER`. Được có nhiều Admin, **mọi Admin ngang quyền**.
    - Admin cấp hoặc gỡ quyền Admin cho người khác, và duyệt, từ chối, khóa, mở khóa tài khoản.
    - Admin đầu tiên khai bằng `ROOT_ADMIN_EMAIL`. Email này đăng ký hoặc đăng nhập **khi chưa có Admin nào** thì tự thành ADMIN + APPROVED.
    - Admin không tự gỡ quyền và không tự khóa mình. Hệ thống chặn gỡ quyền hoặc khóa Admin cuối cùng.
    - Mỗi thay đổi vai trò hoặc khóa đều thu hồi refresh token của người bị ảnh hưởng.
56. **Duyệt tài khoản**
    → **Chốt:** thêm cột `approval_status[WAITING|APPROVED|REJECTED]`, `approved_by`, `approved_at` vào `user_account`. Cột `status` giữ ý nghĩa cũ (PENDING = chưa xác thực OTP).
    - Áp dụng cho cả đăng ký email lẫn Google.
    - Người chưa duyệt vẫn đăng nhập được, nhưng mọi API nghiệp vụ trả 403 `ACCOUNT_NOT_APPROVED`. Chỉ `/api/auth/**`, `/api/me` và `/api/me/consent` là dùng được.
    - JWT có claim `approval`. Vì claim có thể cũ tới 15 phút, backend kiểm tra từ DB ở các thao tác ghi. Trang chờ duyệt của frontend gọi `/api/me` định kỳ, được duyệt thì gọi refresh để lấy claim mới.
57. **Đồng ý NĐ 13 không gắn dòng họ**
    → **Chốt:** `user_consent` không cần `family_id`. Đợt 8 cho phép cột này NULL, Đợt 26 xóa hẳn.
    - Đăng ký email thì lưu consent ngay khi đăng ký.
    - Google lần đầu thì `/api/me` trả `consentRequired=true`, trang chờ duyệt bắt tick, rồi gọi `POST /api/me/consent`.
    - Đổi phiên bản chính sách thì mọi người phải đồng ý lại.
58. **Thành viên**
    → **Chốt:** chỉ `full_name` là bắt buộc, và được **ghi nguyên văn** (có thể có "Cụ", "Bà", "(Tức …)"). `gender` được NULL. **Không tự đặt giới tính.**
    - Bỏ các cột: `family_id`, `branch_id`, `lineage`, `father_id`, `mother_id`, `child_type`, `birth_order`, `generation`, `prefix_override` và toàn bộ cột `locked*`.
    - Tìm không dấu qua `search_name`.
59. 🔁 **Thay bằng #75** (danh sách người thân một chiều, không nhãn ngược). **Quan hệ là nhãn tự nhập**
    → **Chốt:** bảng `member_relation(member_id, related_member_id, label, reverse_label NULL)`.
    - Ý nghĩa: `related_member` là "`label`" của `member`, và `member` là "`reverse_label`" của `related_member`.
    - Mỗi cặp người chỉ có một quan hệ, xét cả hai chiều (UNIQUE trên cặp đã sắp xếp). Không tự nối với chính mình.
    - Nhãn dài tối đa 50 ký tự, cắt khoảng trắng hai đầu.
    - Quan hệ **tách hẳn khỏi cây**, không suy ra cha mẹ, anh em hay đời.
60. **Cây dựng tay**
    → **Chốt:** bảng `tree_node(member_id NULL UNIQUE, parent_node_id, co_parent_node_id, sort_order)` và `tree_spouse(node_id, spouse_node_id UNIQUE, spouse_order)`.
    - Ô vợ/chồng không có `parent_node_id` và không có vợ/chồng riêng.
    - Nút "+ Con" dưới ô: nếu người đó có ≥ 2 vợ/chồng thì bắt buộc chọn `co_parent`. Có đúng 1 thì tự gán. Bấm trên ô vợ/chồng thì cặp là ô đó cùng người kia.
    - Nút "+ Vợ/Chồng" chỉ có trên ô thuộc dòng.
    - Nút "+ Cha/Mẹ" chỉ có trên ô thuộc dòng ở Đời 01. Thêm xong thì cả cây rời đó dịch xuống một đời.
    - Có nhiều gốc. **Đời = độ sâu** tính trên từng cây rời, không lưu trong DB (tính khi đọc).
    - Không tự đặt giới tính khi thêm cha hoặc mẹ.
61. **Gỡ khỏi cây, ô trống, di chuyển**
    → **Chốt:**
    - Gỡ khỏi cây thì đặt `member_id = NULL` (ô trống). Con cháu và vợ/chồng giữ nguyên.
    - Điền ô trống bằng một thành viên chưa có trên cây.
    - Chỉ xóa được ô trống khi không còn con (theo cả `parent_node_id` và `co_parent_node_id`) và không còn vợ/chồng.
    - Di chuyển nhánh: ô thuộc dòng đi kèm vợ/chồng và con cháu, tới làm con của ô khác hoặc thành gốc. Chặn vòng. Máy tính dùng kéo thả, điện thoại dùng menu.
    - Mọi thao tác trên cây chỉ Admin làm, và đều ghi audit log.
62. **Xóa thành viên**
    → **Chốt:** chỉ Admin. **Chặn nếu người đó đang có trên cây** (409 `MEMBER_ON_TREE`).
    - Khi xóa, trong **một transaction**:
      - xóa các dòng người thân có dính tới người đó, cả khi người đó là chủ hồ sơ lẫn khi là người thân (#75);
      - gỡ `user.member_id`;
      - hủy các `member_link_request` đang chờ;
      - ~~tự từ chối các đề xuất đang chờ nhắm tới người đó~~ (❌ bỏ theo #77: đề xuất chỉ còn nhắm tới sự kiện);
      - xóa tệp đính kèm (xóa trên Cloudinary sau khi commit).
    - Audit log lưu snapshot đầy đủ. Có trang "Thành viên đã xóa".
63. **Các chức năng bị bỏ**
    → **Chốt:** bỏ các chức năng sau:
    - dòng họ, mã mời, Manager;
    - khóa nhánh và toàn bộ cột, bộ lọc `locked`;
    - chi (branch), lineage NỘI/DÂU-RỂ/NGOẠI, "Ẩn dòng ngoại" (`hide_maternal_line`);
    - tiền tố xưng hô;
    - màn hình "Lịch sử thay đổi";
    - nhập Excel.

    `audit_log` **vẫn ghi**, bỏ cột `family_id` ở Đợt 26.
64. 🔁 **Thay bằng #76** (User sửa trực tiếp hồ sơ của mình), **#75** (User tự quản danh sách người thân) **và #77** (đề xuất chỉ còn cho sự kiện). **Phạm vi đề xuất của User**
    → **Chốt:** `target_type` gồm MEMBER, RELATION, EVENT. Cụ thể:
    - MEMBER UPDATE chỉ cho chính mình, và cần đã liên kết.
    - RELATION CREATE/UPDATE/DELETE chỉ khi một đầu là chính mình, và cần đã liên kết. CREATE được kèm **thành viên mới** (payload có `newMember`), duyệt thì tạo cả hai.
    - EVENT CREATE/UPDATE/DELETE: không cần liên kết.
    - Không có đề xuất cho cây và không có đề xuất xóa thành viên.
    - Backend kiểm tra phạm vi này, không chỉ ở giao diện.
65. **Sự kiện chung**
    → **Chốt:** Admin tạo, sửa, xóa trực tiếp. User gửi đề xuất (#77).
66. **Quyền xem dữ liệu**
    → **Chốt:** mọi tài khoản đã duyệt xem toàn bộ thành viên, danh sách người thân (#75), cây, lịch và tệp. SĐT và email của thành viên chỉ trả cho Admin và chính chủ (`user.member_id`).
67. **Upload**
    → **Chốt:** 10 MB mỗi file, **1 GB cho toàn hệ thống**, folder Cloudinary `giapha/`. `attachment.kind` gồm AVATAR và DOCUMENT (bỏ COVER vì không còn ảnh bìa dòng họ). `member_id = NULL` nghĩa là tài liệu chung. Chỉ Admin tải lên và xóa, trừ ảnh đại diện của chính mình (#78).
68. **Dữ liệu ban đầu (IDEA Phụ lục A)**
    → **Chốt:** gồm 28 thành viên, lưu ở nguồn duy nhất `shared/fixtures/seed/members.json`.
    - Frontend đọc file này ở chế độ giả lập (Đợt 9).
    - Backend nạp bằng một **migration Flyway sinh từ chính file đó**, chạy ở mọi môi trường kể cả prod (Đợt 27). Có test đối chiếu số lượng và nội dung với JSON.
    - Ngày mất ghi theo âm, không nhuận. Ngày dương được tính sẵn bằng thư viện lịch âm của dự án khi sinh file (có test kiểm tra lại).
    - Lúc đầu cây trống và chưa có người thân nào trong hồ sơ.
69. **Thứ tự lộ trình**
    → **Chốt:** Đợt 8 (BE nhỏ: Admin gốc, duyệt, consent) → **GĐ A: toàn bộ frontend** (Đợt 9–25, kể cả thông báo, AI, export) → **GĐ B: toàn bộ backend** (Đợt 26–38) → **GĐ C:** nối BE thật, E2E, deploy (Đợt 39–41).
70. **Hợp đồng API trước (contract-first)**
    → **Chốt:** `shared/api/openapi.yaml` (OpenAPI 3.1, viết tay) là **nguồn sự thật** của API.
    - `npm run gen:api` sinh `src/services/schema.d.ts` **từ file này**, không từ backend đang chạy. Không viết tay kiểu DTO ở frontend.
    - Mỗi đợt FE viết phần hợp đồng của module mình trước khi làm UI.
    - Backend (GĐ B) phải khớp hợp đồng. Từ Đợt 26 có test hợp đồng so `/v3/api-docs` với `openapi.yaml`: mọi path/method/mã trạng thái và schema của body phải khớp.
    - Đổi API thì sửa `openapi.yaml` trước.
71. **Lớp giả lập ở frontend**
    → **Chốt:** bật bằng `VITE_API_MODE=mock`, code nằm ở `src/services/mock/`.
    - Chỉ những endpoint **có handler** mới bị giả lập, còn lại (auth, `/me`, tài khoản, lịch âm) gọi backend thật.
    - Dữ liệu lưu localStorage (key có số phiên bản), khởi tạo từ `members.json`. Có nút "Khôi phục dữ liệu gốc" (chỉ hiện ở chế độ giả lập).
    - Handler áp đúng quy tắc nghiệp vụ và phân quyền (đọc vai trò từ `/api/me` thật) và trả `ProblemDetail` như backend.
    - **Không tạo dữ liệu giả.** Chỉ có 28 thành viên thật và dữ liệu do chính người dùng nhập.
    - Lớp giả lập không được lọt vào bản build prod. Đợt 39 gỡ bỏ lớp này.
72. **Màn hình cần máy chủ**
    → **Chốt:** ở chế độ giả lập, những phần phụ thuộc máy chủ hiện trạng thái rỗng hoặc thông báo "Cần kết nối máy chủ", và được kiểm thử bằng unit test với dữ liệu test. Các phần đó gồm:
    - trả lời của AI;
    - gửi push;
    - upload Cloudinary;
    - tải file Excel và PDF do backend tạo;
    - gửi thông báo.

    Riêng lịch nhắc (giỗ, sinh nhật, sự kiện) được giả lập bằng `utils/lunar`, và phải cho cùng kết quả với `OccurrenceService` của backend (Đợt 31 so bằng fixture chung).
73. **AI (cập nhật #47, chỉnh theo #75 và #77)**
    → **Chốt:**
    - Các tool: `searchMembers`, `getMember`, `getRelatives` (danh sách người thân của một hồ sơ, cộng với cha mẹ, vợ chồng, con theo cây), `getTreePath`, `upcomingEvents`, `lunarConvert`, `stats`, `draftProposal` (chỉ đề xuất sự kiện, #77).
    - Lượt hỏi: User 15, Admin 30.
    - DTO của AI không có SĐT và email. Tài khoản chưa duyệt không dùng được AI.
74. 🔁 **Thay bằng #84.** **Test bắt buộc (thay phần family/khóa ở #44)**
    → **Chốt:** mỗi endpoint backend phải có các test sau:
    - phân quyền (User gọi API của Admin nhận 403);
    - tài khoản chưa duyệt nhận 403 `ACCOUNT_NOT_APPROVED`;
    - chưa đăng nhập nhận 401.

    Ngoài ra có test cho các ràng buộc Admin cuối cùng, ~~phạm vi đề xuất~~ quyền tự quản hồ sơ (#76, #75), SĐT/email và hợp đồng API.

## K. Hồ sơ tự quản (chốt 2026-09-25, hỏi đáp với người dùng)

75. **Danh sách người thân (thay #59)**
    → **Chốt:** bảng `member_relative(id, member_id, relative_member_id, label VARCHAR(50), created_by, created_at, updated_at)`.
    - Ý nghĩa: trong hồ sơ của `member`, `relative_member` là "`label`". Ví dụ hồ sơ Kỷ có dòng "Cụ Nguyễn Văn Uyên — cha".
    - **Một chiều.** Không có nhãn ngược, và dòng này không tự hiện ở hồ sơ bên kia. Hai người có thể khai về nhau độc lập, với nhãn khác nhau.
    - Ràng buộc: `UNIQUE(member_id, relative_member_id)` (một người chỉ xuất hiện một lần trong danh sách của một hồ sơ), `CHECK member_id <> relative_member_id`. Nhãn bắt buộc, cắt khoảng trắng hai đầu, dài tối đa 50 ký tự. Người thân phải là thành viên đã có. Ngoài ra không có ràng buộc nào khác, người thân có tài khoản hay không, có trên cây hay không đều được.
    - Ai ghi: **chủ hồ sơ** (User đã duyệt có `user.member_id = member_id`, đọc từ DB) và **Admin** (mọi hồ sơ). Có hiệu lực ngay, không qua đề xuất. Mọi thay đổi ghi audit log, không gửi thông báo.
    - Ai xem: mọi tài khoản đã duyệt.
    - Vẫn tách hẳn khỏi cây như #59: không suy ra cha mẹ, anh em hay đời.
76. **User tự sửa hồ sơ của mình (thay phần MEMBER UPDATE của #64)**
    → **Chốt:** User đã duyệt và đã liên kết "Tôi là ai" sửa trực tiếp hồ sơ của chính mình qua `PUT /api/members/{id}`, có hiệu lực ngay.
    - Được sửa mọi trường, **trừ nhóm "đã mất"**: `is_deceased`, `death_year/month/day`, `death_lunar_day/month/leap`, `memorial_override_day/month`, `burial_place`. Nhóm này **chỉ Admin sửa**.
    - Nếu User gửi giá trị khác giá trị đang lưu ở nhóm "đã mất" thì backend trả 403 `DEATH_FIELDS_ADMIN_ONLY`. Giá trị giữ nguyên thì bỏ qua, để form gửi cả object vẫn hợp lệ.
    - User không tạo và không xóa thành viên. Sửa hồ sơ người khác thì nhận 403.
    - Quyền kiểm tra ở backend. Ghi audit log, không gửi thông báo cho Admin.
    - Test bắt buộc: User sửa hồ sơ của mình được, sửa của người khác bị 403, sửa trường "đã mất" bị 403, chưa liên kết thì không sửa được hồ sơ nào.
77. **Đề xuất chỉ còn cho sự kiện chung (thay #64)**
    → **Chốt:** `proposal.target_type` chỉ còn `EVENT`, với CREATE/UPDATE/DELETE, và không cần liên kết.
    - Bỏ các loại MEMBER, RELATION, bỏ `newMember`, bỏ lỗi `MEMBER_LINK_REQUIRED` cho đề xuất.
    - Thêm thành viên mới vào danh sách: chỉ Admin.
    - AI `draftProposal` chỉ soạn đề xuất sự kiện. Muốn sửa hồ sơ hay người thân thì AI hướng dẫn User tự sửa trên trang hồ sơ, AI không tự ghi.
    - Xóa thành viên không còn đụng tới đề xuất.
78. **User tự tải ảnh đại diện (bổ sung #67)**
    → **Chốt:** User đã liên kết được tải ảnh `AVATAR` cho hồ sơ của chính mình. Chỉ nhận jpg/png/webp, tối đa 10 MB, tính vào quota 1 GB, ảnh cũ bị xóa khi thay.
    - Tệp `DOCUMENT`, tài liệu chung và thao tác xóa tệp vẫn chỉ Admin.
    - Backend kiểm tra `memberId = user.member_id` ở cả `sign` và `confirm`.

## L. Tài khoản, liên kết và chia việc hai công cụ (chốt 2026-09-25, hỏi đáp với người dùng)

79. **Thuật ngữ: tài khoản ≠ thành viên**
    → **Chốt:** hai khái niệm tách hẳn.
    - **Tài khoản (user, `user_account`):** người đăng ký, đăng nhập vào hệ thống, có vai trò Admin hoặc User, phải được duyệt.
    - **Thành viên (member, `member`):** một người trong gia phả, là dữ liệu nội dung của hệ thống. Còn sống hay đã mất, có tài khoản hay không đều được.
    - Một tài khoản **có thể** là một thành viên khi đã liên kết ("Tôi là ai"). Admin cũng là tài khoản, không bắt buộc là thành viên.
    - Giao diện gọi người đăng nhập là **"tài khoản"** và người trong gia phả là **"thành viên"**, không dùng lẫn. Trong tài liệu, "User" viết hoa là **vai trò**, còn "tài khoản" là đối tượng.
80. **Liên kết tài khoản – thành viên (bổ sung IDEA §6.3)**
    → **Chốt:** quan hệ **1–1**: `user_account.member_id` NULL UNIQUE, một tài khoản có tối đa một thành viên và ngược lại.
    - **Hai cách liên kết:**
      - User gửi yêu cầu "Đây là tôi", Admin duyệt (giữ như cũ);
      - **Admin gán trực tiếp** ở Quản trị > Tài khoản ("Gán thành viên"), không cần yêu cầu: `PUT /api/admin/accounts/{id}/member-link` (`memberId`).
    - **Ràng buộc khi Admin gán:** chỉ gán cho tài khoản đã duyệt (ACTIVE + APPROVED, sai thì 409 `INVALID_ACCOUNT_STATE`); thành viên đã có tài khoản khác thì 409 `MEMBER_ALREADY_LINKED`; tài khoản đã liên kết thì 409 `ACCOUNT_ALREADY_LINKED` (phải hủy trước); yêu cầu "Đây là tôi" đang chờ của tài khoản đó tự chuyển sang hủy; người được gán nhận thông báo cùng loại với "kết quả liên kết"; ghi audit log.
    - **Hủy liên kết:** User tự hủy của mình (`DELETE /api/me/member-link`), Admin hủy của bất kỳ ai ở Quản trị > Tài khoản (`DELETE /api/admin/accounts/{id}/member-link`).
    - `GET /api/admin/accounts` trả thêm thành viên đang liên kết của mỗi tài khoản.
    - Làm ở Đợt 13 (FE, giả lập) và Đợt 28 (BE); thông báo ở Đợt 34.
81. **Chép email khi liên kết**
    → **Chốt:** **một chiều, một lần**. Khi liên kết có hiệu lực (Admin duyệt yêu cầu hoặc Admin gán), nếu `member.email` đang trống thì chép `user_account.email` sang. Hồ sơ đã có email thì giữ nguyên, không ghi đè.
    - Sau đó hai bên độc lập: sửa email trên hồ sơ **không bao giờ** đổi email đăng nhập (chống chiếm tài khoản qua sửa hồ sơ); đổi email đăng nhập (nếu sau này có) không đổi hồ sơ. Hủy liên kết không xóa email đã chép.
    - Không đồng bộ SĐT (tài khoản không có SĐT, SĐT vẫn nhập ở hồ sơ), không đồng bộ họ tên (họ tên thành viên ghi nguyên văn) và ảnh đại diện.
82. **Liên kết khi khóa hoặc từ chối tài khoản**
    → **Chốt:** giữ nguyên liên kết. Mở khóa hoặc duyệt lại thì tài khoản dùng tiếp như cũ. Muốn giải phóng thành viên thì Admin tự hủy liên kết. Tài khoản bị tự xóa chỉ là tài khoản PENDING quá 7 ngày, chưa bao giờ được duyệt nên không có liên kết.
83. **Chia việc Claude Code / Antigravity (thay #49)**
    → **Chốt:** các đợt FE nhẹ của GĐ A làm bằng **Antigravity**, mọi đợt khác làm bằng **Claude Code**.
    - **Antigravity:** Đợt 11, 20, 21, 23 dùng **Gemini 3.1 Pro**; Đợt 18, 19, 22 dùng **Gemini 3.8 Flash**. Chế độ **Planning**. Không dùng Gemini 3.6/3.7 Flash.
    - Skill duy nhất là `ui-ux-pro-max` (ở `.agents/skills/`). Không có `run`, `dataviz`, `code-review`, `security-review`: đợt Antigravity tự chạy lint/build/test và tự kiểm tra 375px, 1280px bằng trình duyệt của Antigravity. **Không có bước rà lại bằng Claude.**
    - Đợt 23 (quản trị FE) bỏ `security-review` (ngoại lệ so với bảng skill), bù bằng test guard route; quyền thật vẫn do backend chặn ở Đợt 32.
    - Trang "Xuất dữ liệu" (hợp đồng 4 báo cáo, handler 503) chuyển từ Đợt 25 sang Đợt 22. Đợt 25 chỉ còn In cây.
    - `AGENTS.md` ở gốc repo là file ngữ cảnh cho Antigravity: dẫn tới `CLAUDE.md`, ROADMAP, `.claude/rules/*` và ghi rõ các điều cấm mà hook của `.claude/settings.json` không chặn được ở Antigravity (ghi `.env*`, sửa file Flyway cũ, sửa `apps/backend`).
    - Git như cũ: mỗi đợt một nhánh `dot-NN-…`, chỉ commit khi người dùng yêu cầu. Các đợt làm lần lượt, **không chạy song song** hai công cụ.
    - ROADMAP có cột "Công cụ", mẫu "➡️ Đợt tiếp" có thêm "Công cụ".

## M. Tiết kiệm token (chốt 2026-09-25, hỏi đáp với người dùng)

84. **Bỏ test mới, review và bước tự kiểm tra của AI (thay #44, #45, #74 và phần kiểm tra ở #83)**
    → **Chốt:**
    - Không viết test mới ở mọi đợt (kể cả phân quyền, layout cây, lịch âm). Bỏ Đợt 40 (E2E) và `ContractTest`. Test hiện có vẫn giữ và chạy trong CI; đổi code làm test cũ hỏng thì xóa test đó.
    - Bỏ `code-review`, `security-review`, `run`, `dataviz`, `xlsx`/`pdf` và các agent `test-writer`, `code-reviewer`, `security-reviewer`. Skill duy nhất là `ui-ux-pro-max` cho đợt FE (cả Claude Code và Antigravity).
    - AI (Claude Code và Antigravity) không chạy lint/build/test/verify, không mở app hay trình duyệt. AI chỉ chạy `npm run gen:api` khi sửa hợp đồng. Code xong thì tick ✅ ngay, in khối hướng dẫn thủ công (setup, lệnh kiểm tra, bước test tay, lệnh git gợi ý, đợt tiếp) rồi dừng; người dùng tự chạy và báo lỗi.
    - Gộp đợt: 15–16, 18–19, 20–21, 26–27, 33–34, 36–37 (giữ số cũ để không phải sửa tham chiếu).
    - Model: Opus chỉ ở Đợt 14; còn lại Sonnet, effort `high` cho đợt cây, quyền/tài khoản, AI; còn lại `medium`.
    - ROADMAP chỉ giữ đợt chưa làm và một prompt mẫu chung; đợt 0–10 chuyển sang `roadmap/DONE.md`. Mỗi phiên chỉ đọc mục của đợt được giao.
    - Phân quyền vẫn **bắt buộc chặn ở backend** như `.claude/rules/security.md`, chỉ là không có test tự động chứng minh; người dùng tự kiểm bằng bước 🧪.

## Việc còn chờ
- Nhà cung cấp email OTP chính thức.
- Chính sách bảo mật: bản nháp cần người có trách nhiệm pháp lý duyệt.

