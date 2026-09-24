# CLAUDE.md — Tộc Phả (Family Management)

> **Đầu mỗi phiên đọc CLAUDE.md và ROADMAP.md** (`roadmap/ROADMAP.md`). Chỉ làm đúng đợt được giao, xong thì tick ✅ và DỪNG.

## Tổng quan
PWA quản lý gia phả cho nhiều dòng họ: cây gia phả, ngày giỗ âm lịch, sinh nhật, sự kiện, nhắc lịch bằng Web Push, trợ lý AI (Gemini).
- Khoảng 1.000 user, mỗi family khoảng 10 tài khoản, mỗi cây vài trăm người. Chỉ có tiếng Việt, múi giờ `Asia/Ho_Chi_Minh`, ưu tiên điện thoại.
- Có 3 vai trò: System Admin (không thuộc family nào), Family Manager (đúng 1 người mỗi family) và User.
- Dữ liệu của mỗi family tách biệt hoàn toàn. Member bị khóa bị loại khỏi mọi truy vấn nghiệp vụ.

## Tài liệu
| File | Nội dung | Khi nào đọc |
|---|---|---|
| `roadmap/IDEA.md` | Đặc tả nghiệp vụ đã chốt (nguồn sự thật) | Khi làm module liên quan, đọc đúng mục § |
| `docs/DECISIONS.md` | 53 quyết định kỹ thuật, **thắng IDEA.md khi có mâu thuẫn** | Khi phân vân về cách làm |
| `docs/STRUCTURE.md` | Cây thư mục đích của `.claude/`, backend, frontend | Khi tạo file hoặc thư mục mới |
| `docs/DESIGN.md` | Token màu, font, bố cục, mẫu thành phần | **Bắt buộc** trước khi làm UI |
| `roadmap/ROADMAP.md` | Các đợt, checklist, prompt của đợt tiếp | Đầu mỗi phiên |
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
| Test FE | Vitest, Testing Library, Playwright (E2E, từ cuối GĐ1) |
| Dịch vụ ngoài | Cloudinary (file), Google Identity Services (đăng nhập), Gemini `com.google.genai` (GĐ3), Web Push VAPID `nl.martijndwars:web-push` (GĐ2) |
| Báo cáo | Apache POI (Excel), OpenPDF (PDF, nhúng font Be Vietnam Pro) |
| Hạ tầng | Docker Compose trên Oracle Cloud ARM (nginx + app + mysql + certbot), DuckDNS + Let's Encrypt, GHCR, GitHub Actions |

## Cấu trúc thư mục
```
apps/
  backend/                 Spring Boot, package gốc vn.giapha
    src/main/java/vn/giapha/
      config/ common/                       cấu hình và tiện ích dùng chung
      auth family member tree calendar event proposal
      notification file ai report admin     mỗi module: controller/ service/ repository/ entity/ dto/ mapper/
    src/main/resources/db/migration/        Flyway V{n}__*.sql
    .env.example
  frontend/                React + Vite
    src/{assets,components/{ui,shared},layout,pages,features/<module>,hooks,context,services,utils,types}
shared/fixtures/lunar/     dữ liệu đối chiếu âm–dương dùng chung cho BE và FE
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
npm run gen:api      # sinh src/services/schema.d.ts từ http://localhost:8080/v3/api-docs
npm run lint
npm run build        # gồm tsc -b
npm test             # Vitest
```

## Định nghĩa "xong" của một đợt
- **BE:** `.\mvnw.cmd verify` pass, bao gồm test Modulith và test truy cập chéo family.
- **FE:** `npm run lint` và `npm run build` pass. `npm test` pass nếu có test. Đã chạy app và kiểm tra ở khổ 375px và 1280px.
- Đã tick ✅ kèm ngày trong ROADMAP và điền đủ 4 mục cuối đợt.
- **Cuối mỗi đợt in ra chat** khối "➡️ Đợt tiếp": tên đợt, model gợi ý · effort · skill, và nguyên văn prompt của đợt kế (mẫu ở `roadmap/ROADMAP.md`, mục Quy tắc). Sau đó DỪNG, không tự làm đợt kế.

## Quy ước chung
- Tên biến, hàm và commit viết bằng tiếng Anh (Conventional Commits: `feat(member): ...`). Comment tiếng Việt, ngắn, chỉ viết khi cần giải thích "vì sao".
- Chuỗi UI viết thẳng tiếng Việt, không dùng i18n. Lỗi API trả `ProblemDetail` với thông báo tiếng Việt.
- Mỗi đợt một nhánh `dot-NN-<ten>`, rồi mở PR vào `main`. Chỉ commit hoặc push khi người dùng yêu cầu.
- Đổi schema thì **thêm file Flyway V mới**, không sửa file cũ. Entity phải khớp SQL (`ddl-auto: validate`).
- Backend đổi API thì chạy `npm run gen:api`. Không viết tay kiểu DTO ở frontend.
- Thời điểm lưu UTC, logic ngày dùng giờ +7. Lịch âm theo thuật toán Hồ Ngọc Đức, bản Java là nguồn chuẩn.
- **Có bất kỳ điểm nào chưa rõ thì BẮT BUỘC hỏi lại người dùng trước khi làm. Không tự giả định rồi viết luôn.** Hỏi ngắn, nêu rõ điểm chưa rõ và các phương án (kèm khuyến nghị nếu có).
- Không mở rộng phạm vi ngoài đợt đang làm. Thấy việc cần làm thêm thì ghi vào mục ghi chú của đợt, không tự làm.
- Bí mật chỉ đặt trong `.env`, không commit. Chi tiết bảo mật xem `.claude/rules/security.md`.

## Skill
Mỗi đợt ghi rõ các skill phải gọi (xem ROADMAP, mục ➡️):
- BE thường: `code-review`
- Auth, AI, khóa nhánh: `security-review` + `code-review`
- FE: `ui-ux-pro-max` + `run`
- Có biểu đồ hoặc số liệu: thêm `dataviz`
- Export: thêm `anthropic-skills:xlsx` và/hoặc `anthropic-skills:pdf`

Cuối phiên in bảng `skill | đã gọi (có/không)`.
