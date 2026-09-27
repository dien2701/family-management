# CLAUDE.md — Tộc Phả (Family Management)

> **Đầu mỗi phiên** chỉ đọc mục Quy tắc, bảng Tiến độ và mục của đợt được giao trong `roadmap/ROADMAP.md` (không đọc cả file). Chỉ làm đúng đợt đó, xong thì tick ✅, in hướng dẫn thủ công và DỪNG.
> **Tiết kiệm token (DECISIONS #84):** không viết test mới, không review, không chạy lint/build/test/verify, không mở app. Người dùng tự chạy kiểm tra.

## Tổng quan
PWA quản lý **một gia phả chung** (bản chốt v2, 2026-09-25): thành viên, danh sách người thân trong hồ sơ, cây gia phả do Admin dựng tay, ngày giỗ âm lịch, sinh nhật, sự kiện, nhắc lịch bằng Web Push, trợ lý AI (Gemini).
- Khoảng 1.000 tài khoản, vài trăm thành viên. Chỉ có tiếng Việt, múi giờ `Asia/Ho_Chi_Minh`, ưu tiên điện thoại.
- **Không có dòng họ hay tenant** (module `family` cũ sẽ gỡ: FE ở Đợt 10, BE ở Đợt 26). Có 2 vai trò: **Admin** (nhiều người, ngang quyền) và **User**. Tài khoản mới phải được Admin duyệt mới xem được dữ liệu.
- Thành viên chỉ bắt buộc họ tên (ghi nguyên văn), không tự đặt giới tính. Mỗi hồ sơ có danh sách **người thân** một chiều (thành viên đã có + nhãn), độc lập với cây. User đã liên kết "Tôi là ai" tự sửa trực tiếp hồ sơ, người thân và ảnh đại diện của mình, trừ các trường về việc đã mất (chỉ Admin). Đề xuất chỉ còn cho sự kiện chung (DECISIONS mục K #75–#78). Dữ liệu ban đầu là 28 thành viên ở `shared/fixtures/seed/members.json` (IDEA Phụ lục A).
- **Tài khoản ≠ thành viên** (DECISIONS #79–#82): xem mục Thuật ngữ bên dưới. Liên kết 1–1, qua yêu cầu "Tôi là ai" (Admin duyệt) hoặc Admin gán trực tiếp; User tự hủy, Admin hủy được. Khi liên kết, email tài khoản được chép một lần sang hồ sơ nếu ô email đang trống.
- **Hai công cụ** (DECISIONS #83): các đợt FE nhẹ (11, 18–23) làm bằng **Antigravity** (Gemini, đọc `AGENTS.md`), còn lại làm bằng **Claude Code**. Cột "Công cụ" ở bảng Tiến độ của ROADMAP là nguồn sự thật.
- **Đang ở GĐ A: làm toàn bộ frontend trước** bằng chế độ giả lập (`VITE_API_MODE=mock`), rồi mới làm backend (GĐ B), cuối cùng nối lại (GĐ C).

## Thuật ngữ
| Từ | Nghĩa |
|---|---|
| **Tài khoản** (user, `user_account`) | Người đăng ký, đăng nhập vào hệ thống. Có vai trò Admin hoặc User, phải được Admin duyệt |
| **Thành viên** (member, `member`) | Một người trong gia phả, là dữ liệu nội dung của hệ thống. Còn sống hay đã mất, có tài khoản hay không đều được |
| **Liên kết** ("Tôi là ai") | `user_account.member_id`: tài khoản này chính là thành viên kia. 1–1, không bắt buộc |
| **Admin / User** (viết hoa) | **Vai trò** của tài khoản, không phải tên gọi của tài khoản |

Giao diện gọi người đăng nhập là "tài khoản", người trong gia phả là "thành viên", **không dùng lẫn**. Email, SĐT, họ tên của thành viên là dữ liệu hồ sơ, tách khỏi email đăng nhập của tài khoản.

## Tài liệu
| File | Nội dung | Khi nào đọc |
|---|---|---|
| `roadmap/IDEA.md` | Đặc tả nghiệp vụ **bản chốt v2** (nguồn sự thật), Phụ lục A là dữ liệu ban đầu | Khi làm module liên quan, đọc đúng mục § |
| `docs/DECISIONS.md` | 84 quyết định kỹ thuật, **thắng IDEA.md khi có mâu thuẫn**. **Mục J (#54–#74) là đổi hướng v2**, thắng mọi mục trước; **mục K (#75–#78) là hồ sơ tự quản**, thắng mục J; **mục L (#79–#83) là tài khoản ≠ thành viên, liên kết, chia việc Claude Code / Antigravity**, thắng mục K; **mục M (#84) là tiết kiệm token: bỏ test mới, review**, thắng mọi mục trước; quyết định cũ bị hủy có đánh dấu ❌/🔁 | Khi phân vân về cách làm |
| `AGENTS.md` | Ngữ cảnh cho Antigravity: dẫn về file này và ghi các điều cấm thay cho hook | Khi sửa quy tắc chung (giữ hai file khớp nhau) |
| `docs/STRUCTURE.md` | Cây thư mục đích của `.claude/`, backend, frontend | Khi tạo file hoặc thư mục mới |
| `shared/api/openapi.yaml` | **Hợp đồng API** (nguồn sự thật, có từ Đợt 9) | Trước khi làm hoặc đổi bất kỳ API nào |
| `docs/DESIGN.md` | Token màu, font, bố cục, mẫu thành phần | **Bắt buộc** trước khi làm UI |
| `roadmap/ROADMAP.md` | Quy tắc, bảng Tiến độ, prompt mẫu, checklist các đợt còn lại | Đầu mỗi phiên (chỉ mục cần) |
| `roadmap/DONE.md` | Chi tiết Đợt 0–10 đã xong | Chỉ khi cần tra cứu |
| `.claude/rules/backend.md` | Quy tắc BE (tự nạp khi sửa `apps/backend/**`) | Khi làm BE |
| `.claude/rules/frontend.md` | Quy tắc FE (tự nạp khi sửa `apps/frontend/**`) | Khi làm FE |
| `.claude/rules/security.md` | Quy tắc bảo mật chung | Luôn áp dụng |
| `docs/theme.png` | Ảnh phong cách gốc | Khi cần đối chiếu giao diện |

## Stack và phiên bản
Nguồn sự thật về phiên bản là `apps/backend/pom.xml` và `apps/frontend/package.json`. Đợt 0 và Đợt 1 cố định bản patch cụ thể.

| Tầng | Công nghệ |
|---|---|
| Backend | Java 21, **Spring Boot 4.1.x**, Maven Wrapper, Spring Modulith, Spring Security + OAuth2 Resource Server (JWT HS256), Spring Data JPA, Bean Validation, Flyway, MapStruct, springdoc-openapi 3.x, Caffeine, bucket4j |
| DB | **MySQL 8.4 LTS**, `utf8mb4_0900_ai_ci` |
| Test BE | JUnit 5, Testcontainers (MySQL 8.4), Spring Modulith test |
| Frontend | Node 24 LTS, npm, **React 19**, Vite, TypeScript (strict), Tailwind CSS 4, shadcn/ui, lucide, TanStack Query 5, React Router 7 (dạng thư viện), React Hook Form + Zod 4, `@xyflow/react` 12, vite-plugin-pwa, openapi-typescript |
| Test FE | Vitest, Testing Library (chỉ test cũ, không viết mới — #84) |
| Dịch vụ ngoài | Cloudinary (file), Google Identity Services (đăng nhập), Gemini `com.google.genai`, Web Push VAPID `nl.martijndwars:web-push` |
| Báo cáo | Apache POI (Excel), OpenPDF (PDF, nhúng font Be Vietnam Pro) |
| Hạ tầng | Docker Compose trên Oracle Cloud ARM (nginx + app + mysql + certbot), DuckDNS + Let's Encrypt, GHCR, GitHub Actions |

## Cấu trúc thư mục
```
apps/
  backend/                 Spring Boot, package gốc vn.giapha
    src/main/java/vn/giapha/
      config/ common/                       cấu hình và tiện ích dùng chung
      auth member tree calendar event proposal
      notification file ai report admin     mỗi module: controller/ service/ repository/ entity/ dto/ mapper/
      (family: module cũ, gỡ ở Đợt 26)
    src/main/resources/db/migration/        Flyway V{n}__*.sql
    .env.example
  frontend/                React + Vite
    src/{assets,components/{ui,shared},layout,pages,features/<module>,hooks,context,services,utils,types}
    src/services/mock/     lớp giả lập của GĐ A (gỡ ở Đợt 39)
shared/api/openapi.yaml    hợp đồng API viết tay, nguồn sinh kiểu TS và chuẩn để BE khớp
shared/fixtures/           lunar/ (âm–dương), seed/ (28 thành viên), tree/, occurrences/: dữ liệu đối chiếu dùng chung BE và FE
infra/                     docker-compose.dev.yml, docker-compose.prod.yml, nginx/, backup/
.github/workflows/         ci.yml, deploy.yml
docs/                      DECISIONS.md, DESIGN.md, STRUCTURE.md, theme.png
roadmap/                   IDEA.md, ROADMAP.md
.claude/                   rules/, skills/, agents/, settings.json;  .mcp.json ở gốc
```
Cây đầy đủ kèm chú thích: `docs/STRUCTURE.md`. Các module BE chỉ gọi nhau qua facade ở package gốc (Spring Modulith).

## Lệnh
Lệnh viết cho PowerShell. Trên Git Bash thì dùng `./mvnw` thay cho `.\mvnw.cmd`.

```bash
# DB cho dev (MySQL 8.4)
docker compose -f infra/docker-compose.dev.yml up -d

# Backend (trong apps/backend)
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev   # http://localhost:8080, Swagger: /swagger-ui.html
.\mvnw.cmd verify                                           # build + toàn bộ test (cần Docker)
.\mvnw.cmd test -Dtest=LunarCalendarTest                    # chạy 1 lớp test

# Frontend (trong apps/frontend)
npm install
npm run dev          # http://localhost:5173, proxy /api tới :8080
npm run dev:mock     # (từ Đợt 9) chế độ giả lập: endpoint có handler chạy ở trình duyệt, còn lại (auth, /me, tài khoản) gọi BE thật
npm run gen:api      # sinh src/services/schema.d.ts (từ Đợt 9: đọc shared/api/openapi.yaml, không cần BE chạy)
npm run lint:api     # (từ Đợt 9) kiểm tra openapi.yaml
npm run lint
npm run build        # gồm tsc -b
npm test             # Vitest
```

## Định nghĩa "xong" của một đợt (DECISIONS #84)
- Code xong checklist của đợt (AI không tự chạy kiểm tra). Có sửa hợp đồng thì đã chạy `npm run gen:api`.
- Đã tick ✅ kèm ngày trong ROADMAP (checkbox, tiêu đề, bảng Tiến độ) và điền **✅ Đã làm**.
- **In ra chat khối hướng dẫn thủ công** theo mẫu ở ROADMAP mục Quy tắc: setup, lệnh kiểm tra để người dùng tự chạy (FE: `npm run lint`, `npm run build`; BE: `.\mvnw.cmd compile`), các bước test tay (FE kèm 375px/1280px), lệnh git gợi ý, và "➡️ Đợt tiếp" kèm prompt mẫu đã điền. Sau đó DỪNG.
- Người dùng báo lỗi thì sửa trong cùng phiên. Test cũ hỏng vì đổi code thì xóa test đó, không sửa.

## Quy ước chung
- Tên biến, hàm và commit viết bằng tiếng Anh (Conventional Commits: `feat(member): ...`). Comment tiếng Việt, ngắn, chỉ viết khi cần giải thích "vì sao".
- Chuỗi UI viết thẳng tiếng Việt, không dùng i18n. Lỗi API trả `ProblemDetail` với thông báo tiếng Việt.
- Mỗi đợt một nhánh `dot-NN-<ten>`, rồi mở PR vào `main`. Chỉ commit hoặc push khi người dùng yêu cầu.
- Đổi schema thì **thêm file Flyway V mới**, không sửa file cũ. Entity phải khớp SQL (`ddl-auto: validate`).
- **Hợp đồng trước:** mọi API mới hoặc đổi API đều sửa `shared/api/openapi.yaml` trước, rồi `npm run gen:api`. Không viết tay kiểu DTO ở frontend. Backend phải khớp hợp đồng (DECISIONS #70).
- **Không tạo dữ liệu giả** trong app hay lớp giả lập: chỉ có 28 thành viên thật và dữ liệu người dùng tự nhập. Dữ liệu mẫu chỉ được dùng trong test.
- Thời điểm lưu UTC, logic ngày dùng giờ +7. Lịch âm theo thuật toán Hồ Ngọc Đức, bản Java là nguồn chuẩn.
- **Có bất kỳ điểm nào chưa rõ thì BẮT BUỘC hỏi lại người dùng trước khi làm. Không tự giả định rồi viết luôn.** Hỏi ngắn, nêu rõ điểm chưa rõ và các phương án (kèm khuyến nghị nếu có).
- Không mở rộng phạm vi ngoài đợt đang làm. Thấy việc cần làm thêm thì ghi vào mục ghi chú của đợt, không tự làm.
- Bí mật chỉ đặt trong `.env`, không commit. Chi tiết bảo mật xem `.claude/rules/security.md`.

## Skill
- Skill duy nhất: `ui-ux-pro-max` cho đợt FE (Claude Code gọi qua công cụ Skill; Antigravity dùng bản ở `.agents/skills/`).
- Không dùng `code-review`, `security-review`, `run`, `dataviz`, `xlsx`/`pdf` và các agent test/review (DECISIONS #84).
- Khi in "➡️ Đợt tiếp", ghi **Công cụ** và Model · Effort theo bảng Tiến độ.
