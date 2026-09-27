# CẤU TRÚC DỰ ÁN

> Chốt 2026-09-25 (DECISIONS #51–53), cập nhật theo đổi hướng v2 (DECISIONS #54–#74: bỏ dòng họ, hợp đồng API trước, lớp giả lập FE). Đây là cấu trúc **đích**. Đợt 0 dựng backend, Đợt 1 dựng frontend, các thư mục còn lại tạo dần theo từng đợt.
> Quy tắc chung: Controller mỏng, logic nằm ở Service. Cấu hình, tiện ích và kiểu dùng chung tách riêng. Cấu trúc phải mở rộng được mà không phải đổi chỗ file.

## 1. Toàn repo

```
Family-Management/
├── CLAUDE.md                     Hướng dẫn cho Claude (ngắn, rõ)
├── AGENTS.md                     Ngữ cảnh cho Antigravity, dẫn về CLAUDE.md (DECISIONS #83)
├── .claude/                      Cấu hình Claude Code (mục 2)
├── .agents/skills/               Skill cho Antigravity (ui-ux-pro-max…)
├── .mcp.json                     Kết nối công cụ ngoài, dùng HTTP
├── apps/
│   ├── backend/                  Spring Boot (mục 3)
│   └── frontend/                 React + Vite (mục 4)
├── shared/
│   ├── api/openapi.yaml          Hợp đồng API viết tay, nguồn sự thật (DECISIONS #70)
│   └── fixtures/                 Dữ liệu đối chiếu dùng chung BE và FE
│       ├── lunar/                  Âm–dương 1900–2100
│       ├── seed/                   members.json: 28 thành viên ban đầu (IDEA Phụ lục A) + script sinh SQL
│       ├── tree/                   Các ca thao tác dựng cây và kết quả mong đợi
│       └── occurrences/            Các ca lịch nhắc (giỗ, sinh nhật, sự kiện)
├── infra/                        docker-compose.dev|prod.yml, nginx/, backup/
├── .github/workflows/            ci.yml, deploy.yml
├── docs/                         DECISIONS.md, DESIGN.md, STRUCTURE.md, theme.png
├── roadmap/                      IDEA.md, ROADMAP.md
├── .gitignore
└── README.md
```

## 2. Thư mục `.claude/`

```
.claude/
├── settings.json                 Quyền, hook (commit lên git)
├── settings.local.json           Cấu hình riêng của máy (không commit)
├── rules/                        Quy tắc dạng module, có thể giới hạn theo path
│   ├── backend.md                  paths: apps/backend/**
│   ├── frontend.md                 paths: apps/frontend/**
│   └── security.md                 áp dụng toàn repo
├── skills/                       Quy trình lặp lại (mỗi skill một thư mục có SKILL.md)
│   ├── dot-close/
│   │   └── SKILL.md                Đóng đợt: chạy lệnh kiểm tra, tick ROADMAP, in bảng skill
│   ├── be-slice/
│   │   ├── SKILL.md                Thêm một lát cắt BE vào module
│   │   └── references/             Mẫu entity, service, controller
│   ├── fe-feature/
│   │   ├── SKILL.md                Nối một module FE với API
│   │   └── references/             Mẫu api.ts, hooks.ts, trang, strings.ts
│   └── flyway-migration/
│       ├── SKILL.md                Tạo file V{n+1} và sửa entity cho khớp
│       └── scripts/next-version.ps1   In ra số V tiếp theo
└── agents/                       (trống: agent test/review đã xóa theo DECISIONS #84)
```

**Hook trong `settings.json`:**

| Sự kiện | Việc làm |
|---|---|
| `PreToolUse` (Edit/Write) | Chặn ghi vào `.env*` (trừ `.env.example`) và vào file Flyway `V*.sql` đã có |
| `PostToolUse` (Edit/Write) | Sửa file `apps/frontend/**` thì chạy `eslint --fix` trên file đó |
| `SessionStart` | In nhắc "đọc CLAUDE.md và roadmap/ROADMAP.md, chỉ làm một đợt" |

**`.mcp.json`:** kết nối bằng HTTP, ưu tiên cài ở phạm vi dự án.

| Server | Dùng cho |
|---|---|
| `playwright` | Điều khiển trình duyệt (chỉ khi người dùng yêu cầu; E2E đã bỏ theo #84) |
| `mysql-dev` | Chỉ đọc DB dev để kiểm tra dữ liệu, không trỏ tới prod |

## 3. Backend: `apps/backend/`

Module trước, lớp phẳng trong module (DECISIONS #8, #51). Mỗi module là một package, giao tiếp với module khác qua facade ở package gốc của module.

```
apps/backend/
├── pom.xml                       Phiên bản là nguồn sự thật
├── mvnw, mvnw.cmd, .mvn/         Maven Wrapper
├── Dockerfile                    Multi-stage, arm64
├── .env                          Bí mật (không commit)
├── .env.example                  Mẫu các khóa
├── README.md
└── src/
    ├── main/
    │   ├── java/vn/giapha/
    │   │   ├── GiaPhaApplication.java     Điểm vào của ứng dụng
    │   │   ├── config/                    Cấu hình dùng chung
    │   │   │   ├── SecurityConfig.java      Chuỗi filter, JWT decoder, CORS tắt
    │   │   │   ├── JpaConfig.java           Auditing, Clock UTC
    │   │   │   ├── CacheConfig.java         Caffeine
    │   │   │   ├── OpenApiConfig.java       springdoc
    │   │   │   └── AppProperties.java       Đọc mục app.* của YAML
    │   │   ├── common/                    Dùng chung, không chứa nghiệp vụ riêng của module
    │   │   │   ├── audit/                   AuditLogWriter, AuditLog entity
    │   │   │   ├── security/                CurrentUser, JwtService, RateLimiter, hằng số vai trò
    │   │   │   ├── exception/               BusinessException, GlobalExceptionHandler (ProblemDetail)
    │   │   │   ├── consent/                 user_consent
    │   │   │   ├── web/                     Trang kết quả (phân trang)
    │   │   │   └── util/                    SearchText (bỏ dấu), DateUtils, IdGenerator
    │   │   │
    │   │   ├── auth/                      ┐
    │   │   ├── member/                    │
    │   │   ├── tree/                      │  Mỗi module có cùng bố cục
    │   │   ├── calendar/                  │  (xem ví dụ member/ bên dưới)
    │   │   ├── event/                     │
    │   │   ├── proposal/                  │
    │   │   ├── notification/              │
    │   │   ├── file/                      │
    │   │   ├── ai/                        │
    │   │   ├── report/                    │
    │   │   └── admin/                     ┘
    │   │
    │   │   member/                      Ví dụ một module
    │   │   ├── MemberFacade.java          API công khai cho module khác (chỉ file ở gốc là public)
    │   │   ├── package-info.java          @ApplicationModule
    │   │   ├── controller/                Nhận request, @Valid, trả response
    │   │   ├── service/                   Toàn bộ nghiệp vụ, @Transactional
    │   │   ├── repository/                Spring Data JPA, truy vấn tường minh
    │   │   ├── entity/                    Entity JPA, khớp SQL Flyway
    │   │   ├── dto/                       record request/response
    │   │   ├── mapper/                    MapStruct
    │   │   ├── validator/                 Validator tùy chỉnh (Bean Validation)
    │   │   └── event/                     Application event phát ra (nếu có)
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml, application-prod.yml, application-e2e.yml
    │       ├── db/migration/              V1__audit_log.sql, V2__auth.sql, ...
    │       └── fonts/                     Be Vietnam Pro cho OpenPDF
    └── test/
        ├── java/vn/giapha/
        │   ├── ModularityTests.java       ApplicationModules.verify()
        │   ├── support/                   Base class Testcontainers, dữ liệu mẫu, helper JWT
        │   └── <module>/                  Test cũ theo module (không viết thêm, #84)
        └── resources/                   Fixture test
```

**Tương ứng với cấu trúc Node ở ảnh:**

| Ảnh (Node/Express) | Backend này |
|---|---|
| `config/` | `config/` + `application*.yml` |
| `controllers/`, `routes/` | `<module>/controller/` (Spring dùng annotation nên không có file route riêng) |
| `models/` | `<module>/entity/` + Flyway |
| `services/` | `<module>/service/` |
| `middlewares/` (auth, lỗi, validate) | `SecurityConfig`, `common/exception/`, Bean Validation |
| `utils/` | `common/util/` |
| `types/` | `<module>/dto/` (record) |
| `validators/` | `<module>/validator/` + annotation trên DTO |
| `app.ts`, `server.ts` | `GiaPhaApplication.java` |
| `.env` | `.env` + `.env.example` |

**Quy tắc phụ thuộc:** `controller → service → repository`. Module A chỉ gọi `BFacade` của module B, không đụng vào `service/` hay `repository/` của B. `ModularityTests` bắt lỗi này.

## 4. Frontend: `apps/frontend/`

Tên thư mục theo ảnh, bỏ `redux/` (DECISIONS #52). Trạng thái từ server dùng TanStack Query, trạng thái toàn cục nhỏ (đăng nhập) dùng `context/`.

```
apps/frontend/
├── package.json                  Phiên bản là nguồn sự thật
├── vite.config.ts                Proxy /api, vite-plugin-pwa
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js              ESLint flat config
├── components.json               Cấu hình shadcn/ui
├── index.html
├── .env.local                    VITE_GOOGLE_CLIENT_ID (không commit)
├── .gitignore
├── README.md
├── public/                       Phục vụ nguyên trạng
│   ├── icons/                      Icon PWA 192, 512, maskable
│   └── favicon.svg
└── src/
    ├── main.tsx                  Điểm vào, gắn providers
    ├── App.tsx                   Router + khung ứng dụng
    ├── index.css                 Tailwind + token theo docs/DESIGN.md
    │
    ├── assets/                   Ảnh, font, icon tĩnh
    │   ├── fonts/                    Be Vietnam Pro
    │   └── images/                   Hình minh họa, ảnh trống
    ├── components/               Component dùng chung, chỉ nhận props, không gọi API
    │   ├── ui/                       shadcn/ui: Button, Dialog, Sheet, Input, ...
    │   └── shared/                   Ghép từ ui: DualDateInput, AvatarUpload, StatTile, EmptyState, ...
    ├── layout/                   Bộ khung trang
    │   ├── AppShell.tsx              Ghép Sidebar, Header, BottomNav
    │   ├── Sidebar.tsx               ≥1024px (rail 72px ở 768–1023px)
    │   ├── BottomNav.tsx             <768px, 5 mục
    │   ├── Header.tsx                Quay lại, tìm kiếm, chuông, avatar
    │   ├── AuthLayout.tsx            Trang đăng nhập, đăng ký
    ├── pages/                    Chỉ ghép route với trang của feature, không chứa logic
    │   ├── routes.tsx                Bảng route, guard theo vai trò
    │   ├── DashboardPage.tsx
    │   ├── TreePage.tsx
    │   ├── MembersPage.tsx, MemberDetailPage.tsx
    │   ├── CalendarPage.tsx
    │   ├── AssistantPage.tsx
    │   ├── SettingsPage.tsx
    │   ├── PrivacyPolicyPage.tsx
    │   └── NotFoundPage.tsx
    ├── features/                 Mỗi module nghiệp vụ một thư mục, khớp module backend
    │   ├── auth/                     api.ts, hooks.ts, schemas.ts (Zod), strings.ts, components/, pages/
    │   ├── member/
    │   ├── tree/
    │   │   └── layout/               layoutTree.ts (hàm thuần) + test
    │   ├── calendar/
    │   ├── event/
    │   ├── proposal/
    │   ├── notification/
    │   ├── file/
    │   ├── ai/
    │   ├── report/
    │   └── admin/
    ├── hooks/                    Hook dùng chung: useMediaQuery, useDebounce, useOnlineStatus
    ├── context/                  AuthContext (token trong bộ nhớ, approvalStatus, vai trò)
    ├── services/                 Tầng gọi API dùng chung
    │   ├── client.ts                 Wrapper fetch, gắn Bearer, tự refresh khi 401, parse ProblemDetail
    │   ├── queryClient.ts            Cấu hình TanStack Query
    │   ├── schema.d.ts               Sinh từ shared/api/openapi.yaml bằng `npm run gen:api`, KHÔNG sửa tay
    │   └── mock/                     Lớp giả lập GĐ A (router, store localStorage, handlers/<module>.ts); gỡ ở Đợt 39
    ├── utils/                    Hàm thuần dùng chung
    │   ├── lunar/                    Bản TS của lịch âm (chạy chung fixture với Java)
    │   ├── tree/                     Mô hình cây thuần: đời, tổ tiên, kiểm tra thao tác (fixture shared/fixtures/tree)
    │   ├── occurrences/              Lịch nhắc thuần (fixture shared/fixtures/occurrences)
    │   ├── date.ts                   Định dạng dd/MM/yyyy, múi giờ +7
    │   ├── text.ts                   Bỏ dấu tiếng Việt, chuẩn hóa tìm kiếm
    │   └── cn.ts                     Ghép className
    └── types/                    Kiểu dùng chung không sinh từ OpenAPI (kiểu UI, enum tiếng Việt)
```

**Bố cục một feature** (ví dụ `features/member/`):

```
features/member/
├── api.ts            Hàm gọi API qua services/client.ts
├── hooks.ts          useMembers, useMember, useCreateMember (TanStack Query)
├── schemas.ts        Zod schema cho form
├── strings.ts        Chuỗi tiếng Việt
├── components/       MemberForm, MemberCard, RelativesBlock, ...
└── pages/            MemberListView, MemberDetailView (được pages/ ghép vào route)
```

**Quy tắc phụ thuộc:** `pages → features → components/services/hooks/utils`. `components/` không import từ `features/`. Một feature không import trực tiếp từ feature khác, mà dùng lại qua `components/shared/` hoặc qua `hooks` công khai của feature đó.

**Tương ứng với ảnh:**

| Ảnh | Frontend này |
|---|---|
| `public`, `assets`, `components`, `layout`, `pages` | giữ nguyên |
| `features` | giữ nguyên, khớp module backend |
| `hooks`, `context`, `services`, `utils` | giữ nguyên |
| `redux` | **bỏ** (dùng TanStack Query + context) |
| `App.jsx`, `main.jsx`, `index.css`, `vite.config.js` | `.tsx`/`.ts` (TypeScript) |
| `.eslintrc.json` | `eslint.config.js` (flat config) |

## 5. Khi nào tạo thư mục nào

Không tạo sẵn thư mục rỗng. Mỗi đợt chỉ tạo phần mình cần, theo cấu trúc trên.

| Phần | Tạo ở |
|---|---|
| Khung `apps/backend`, `config/`, `common/`, 13 package module rỗng | Đợt 0 |
| Khung `apps/frontend`, `layout/`, `components/ui`, `services/`, `utils/` | Đợt 1 |
| `.claude/skills/*`, `.claude/agents/*`, hook, `.mcp.json` | Đợt 0 (viết ngay, dùng từ Đợt 2) |
| Từng module BE và `features/<module>` | Đợt của module đó |
| `utils/lunar/`, `shared/fixtures/lunar/` | Đợt 6–7 |
| `shared/api/openapi.yaml`, `shared/fixtures/seed/`, `services/mock/` | Đợt 9 |
| `utils/tree/`, `shared/fixtures/tree/` | Đợt 14 |
| `utils/occurrences/`, `shared/fixtures/occurrences/` | Đợt 17 |
| Gỡ `features/family` (FE) / module `family` (BE) | Đợt 10 / Đợt 26 (đã xong) |
| `infra/`, `.github/workflows/deploy.yml` | Đợt 41 |
