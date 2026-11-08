Nguồn: skill ui-ux-pro-max + docs/theme.png

# DESIGN — Hệ thống giao diện

> Ảnh `docs/theme.png` là một dashboard giáo dục, nên chỉ lấy **phong cách** (navy + xanh dương, thẻ bo tròn gần như phẳng), không lấy nội dung.
> Skill ui-ux-pro-max đối chiếu: phong cách *Minimalism*, font Be Vietnam Pro, icon lucide, kiểm tra tương phản ≥ 4.5:1, focus nhìn thấy được, tôn trọng `prefers-reduced-motion`.
> Giao diện sáng là mặc định; có thêm giao diện tối (bảng ghi đè `:root.dark` trong `src/index.css`, đổi ở nút trên header và trang Cài đặt; DECISIONS #36 đã đổi 2026-09-26). Ưu tiên điện thoại. WCAG AA, chữ nền tối thiểu 16px.

## 1. Token màu

Định nghĩa trong `apps/frontend/src/index.css` bằng `@theme` của Tailwind 4 và map sang biến CSS của shadcn (mục 8). **Cấm viết mã hex trong component.**

| Nhóm | Token | Hex | Dùng cho |
|---|---|---|---|
| Nền | `--color-bg` | `#EEF3F8` | Nền trang (xám xanh nhạt) |
| | `--color-surface` | `#FFFFFF` | Thẻ, sidebar, header, modal |
| | `--color-surface-muted` | `#F5F7FA` | Ô con trong thẻ, hàng xen kẽ, nền input |
| | `--color-border` | `#E3E8EF` | Viền thẻ, đường kẻ |
| Primary | `--color-primary` | `#24466F` | Thẻ nhấn navy, nút chính, mục menu đang chọn |
| | `--color-primary-hover` | `#1B3658` | Hover/active của primary |
| | `--color-primary-fg` | `#FFFFFF` | Chữ trên nền primary |
| Secondary | `--color-secondary` | `#E4ECF6` | Nền nút phụ, chip, tab đang chọn |
| | `--color-secondary-hover` | `#D3E0F0` | Hover của secondary |
| | `--color-secondary-fg` | `#24466F` | Chữ trên nền secondary |
| Accent | `--color-accent` | `#1C9BE6` | Thanh tiến độ, icon, focus ring, chấm "sinh nhật". **Không dùng cho chữ nhỏ trên nền trắng** |
| | `--color-accent-text` | `#0B6FB3` | Link, chữ có màu nhấn |
| Neutral | `--color-text` | `#0F1B2D` | Chữ chính |
| | `--color-text-muted` | `#5B6B7F` | Chữ phụ (≥ 4.5:1 trên nền trắng) |
| | `--color-deceased` | `#9AA5B1` | Viền ô cây và chữ phụ của người đã mất |
| | `--color-tree-line` | `#C9D3DF` | Đường nối trên cây (hôn nhân, cha mẹ–con), nét 1.5px |
| Trạng thái | `--color-success` / `-bg` | `#1F7A45` / `#E6F6EC` | Badge "Còn sống", "Đã duyệt" |
| | `--color-warning` / `-bg` | `#9A5B00` / `#FFF4DE` | Badge "Chờ duyệt", cảnh báo xung đột |
| | `--color-danger` / `-bg` | `#C5221F` / `#FDECEA` | Lỗi, nút Xóa/Khóa |
| Mẫu điện thoại (#96) | `--color-header` | `#D6E6F5` (tối `#172539`) | Nền header (cả điện thoại và máy tính) |
| | `--color-hero-from` / `--color-hero-to` | `#D9E8F7` → `#F7FAFD` (tối `#1E3352` → `#16202F`) | Nền chuyển màu nhạt của thẻ chào Trang chủ (`bg-linear-to-br from-hero-from to-hero-to`) |

**Màu theo loại sự kiện.** Luôn kèm icon hoặc chữ, không phân biệt bằng màu đơn thuần:

| Loại | Token | Hex | Icon lucide |
|---|---|---|---|
| Giỗ | `--color-event-memorial` | `#6D4AA8` | `flame` |
| Sinh nhật | `--color-event-birthday` | `#1C9BE6` | `cake` |
| Sự kiện chung | `--color-event-custom` | `#C77700` | `calendar-heart` |

## 2. Chữ

- Font: **Be Vietnam Pro** (Google Fonts, weight 400/500/600/700, `display=swap`), fallback `system-ui, sans-serif`.
- Icon: **lucide** (SVG), không dùng emoji làm icon. Icon đứng một mình phải có `aria-label`.

| Vai trò | Cỡ (px) | Weight | Line-height |
|---|---|---|---|
| Chú thích, nhãn nhỏ | 14 | 400/500 | 1.5 |
| Chữ nền, input, nút | 16 | 400/500/600 | 1.5 |
| Tiêu đề thẻ | 18 | 600 | 1.25 |
| Tiêu đề trang | 20 (mobile) / 24 (desktop) | 700 | 1.25 |
| Số liệu lớn dashboard | 32 | 700 | 1.25 |

Số đếm (đếm ngược, thống kê) dùng `font-variant-numeric: tabular-nums`.

## 3. Khoảng cách, bo góc, bóng

- **Spacing** theo bội số của 4: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Padding thẻ `16px` (mobile), `24px` (≥768px). Khe giữa các thẻ `16px`.
- **Bo góc:** thẻ lớn `16px`, ô con và input `12px`, nút `10px`, badge/chip `9999px`.
- **Bóng:** `--shadow-card: 0 2px 12px rgb(36 70 111 / 0.08)` (tối `0 2px 12px rgb(0 0 0 / 0.35)`): bóng mềm, lan rộng, nhạt theo ảnh mẫu `image/` (DECISIONS #96). Modal và popover dùng `--shadow-overlay: 0 8px 24px rgb(15 27 45 / 0.16)`.
- Vùng chạm tối thiểu **44×44px**, khoảng cách giữa hai vùng chạm ≥ 8px.
- Focus ring `2px` màu `--color-accent`, offset `2px`. Không bao giờ bỏ outline.

## 4. Breakpoint và bố cục

| Tên | Từ | Bố cục |
|---|---|---|
| (mặc định) | 0 | Một cột, header gọn, thanh điều hướng dưới |
| `md` | 768px | Sidebar thu 72px (chỉ icon), lưới 2 cột |
| `lg` | 1024px | Sidebar 240px, lưới 12 cột |
| `xl` | 1280px | Nội dung tối đa `1200px`, căn giữa |

- **Máy tính (≥1024px):** sidebar trắng rộng 240px bên trái (logo, menu có icon, mục đang chọn nền primary chữ trắng). Header trên nội dung: nút quay lại, tiêu đề + breadcrumb, ô tìm kiếm, chuông, avatar và vai trò.
- **Điện thoại (<768px):** header nền `--color-header`; Trang chủ dùng header thương hiệu (logo `favicon.svg` + "Tộc Phả"), trang khác là quay lại + tên trang; bên phải giữ nút giao diện, chuông, tài khoản/Đăng nhập. **Thanh điều hướng dưới** đúng 5 mục: Tổng quan · Cây · Thành viên · Sự kiện · Thêm (khách: mục cuối là Đăng nhập). Chừa `env(safe-area-inset-bottom)`. Chi tiết ở mục 9.
- **Máy tính (≥768px):** đổi theo token mới (nền header, bóng thẻ, tiêu đề mục) nhưng **giữ nguyên bố cục** sidebar, header, lưới cột (DECISIONS #96).
- Kiểm tra mọi màn hình ở 375px và 1280px, không cuộn ngang.

## 5. Chuyển động

- Thời lượng `150–250ms`, easing `ease-out` khi vào, `ease-in` khi ra (ra nhanh hơn vào). Chỉ animate `opacity` và `transform`.
- Nút và mọi phần tử bấm được có `cursor-pointer` và trạng thái hover/active rõ ràng.
- Bắt buộc `@media (prefers-reduced-motion: reduce)` tắt animation.

## 6. Thành phần chính

Dùng shadcn/ui làm nền, chỉnh theo token ở trên.

| Thành phần | Quy cách |
|---|---|
| **Button** | Cao 44px, bo 10px, chữ 16px/600. `primary`: nền `--color-primary`, chữ `--color-primary-fg`. `secondary`: nền `--color-secondary`. `ghost`: trong suốt, hover `--color-surface-muted`. `danger`: nền `--color-danger`. Disabled giảm opacity 50%, kèm spinner khi đang gửi. |
| **Input / Select** | Cao 44px, bo 12px, nền `--color-surface-muted`, viền `--color-border`. Nhãn luôn hiện phía trên (không dùng placeholder thay nhãn). Lỗi: viền `--color-danger` + thông báo ngay dưới trường. Có dòng gợi ý (helper) khi cần. |
| **Card** | Nền `--color-surface`, bo 16px, `--shadow-card`, viền `--color-border` 1px. Biến thể `card-primary` (navy, chữ trắng) cho thẻ hồ sơ. Thẻ có tiêu đề mục dùng `SectionCard` (mục 9). |
| **Table** (≥768px) | Header nền `--color-surface-muted`, chữ 14px/600 muted. Hàng cao ≥ 48px, xen kẽ `--color-surface-muted`. Dưới 768px chuyển thành danh sách thẻ (IDEA §6.3). |
| **Modal / Sheet** | Desktop: modal giữa màn hình, rộng tối đa 480px, bo 16px, `--shadow-overlay`. Mobile: bottom sheet bo góc trên 16px. Có nút đóng ≥ 44px, khóa cuộn nền, trả focus về nút mở, đóng bằng `Esc`. |
| **Nav (sidebar)** | Mục cao 44px, icon lucide 20px + chữ 16px. Đang chọn: nền `--color-primary`, chữ trắng. Thu 72px ở `md` (chỉ icon, có `aria-label`/tooltip). |
| **Nav (bottom bar)** | 5 mục, icon 24px + nhãn 12px, mỗi mục ≥ 44px. Mục đang chọn **không tô kín**: icon + chữ màu `--color-primary`, chữ 600, nền `--color-secondary` bo tròn quanh icon (mục 9). |
| **Badge** | Viên thuốc, chữ 14px/500, cặp màu `-bg` + màu chữ tương ứng của trạng thái. Luôn có chữ, không chỉ màu. |
| **Thẻ hồ sơ (chi tiết member)** | Thẻ primary navy, avatar vuông bo 16px, badge trạng thái góc trên trái, tên chữ trắng đậm, dòng phụ: năm sinh – năm mất và đời. Bên dưới là các ô trắng lồng trong thẻ, mỗi ô một dòng liên hệ có icon tròn (SĐT, email, nơi chôn cất). |
| **Thẻ số liệu (dashboard)** | Ô `--color-surface-muted` bo 12px trong `SectionCard` "Gia phả", nhãn muted 14px, số 24px (32px ở máy tính). Biểu đồ dùng Recharts theo skill dataviz, không dựa vào màu đơn thuần. |
| **Nút thành viên trên cây** | Rộng 200px, cao 72px, bo 12px, nền trắng, viền `--color-border`. Gồm avatar 40px, tiền tố + tên (16px/600, tối đa 2 dòng) và năm sinh – năm mất (14px muted). Người đã mất: viền `--color-deceased` + dấu ✝. Nhãn đặc biệt hiện dạng badge. Đang chọn: viền `--color-accent` 2px. Đường nối `--color-tree-line`, nét 1.5px. Toàn bộ nút là vùng bấm. Ô trống: viền đứt, nền `--color-surface-muted`, chữ "Ô trống". Năm sinh – mất dùng chữ `--color-text-muted` (đủ tương phản), `--color-deceased` chỉ dành cho viền. Nhãn đặc biệt và "Tôi" là thẻ nhỏ đè lên viền trên của ô. Cột "Đời 01…N" cố định bên trái sơ đồ (nền trắng, chữ 14px/600 muted). Nút "+" của Admin (máy tính): chấm tròn 24px trên viền ô, vùng bấm nới ra 40px; điện thoại thêm qua menu của ô. |
| **Lịch tháng** | Ô ngày: số dương 16px, số âm 13px muted, chấm màu theo loại sự kiện (kèm icon ở chi tiết). Mobile: danh sách theo tuần. |
| **Trạng thái rỗng** | Icon lucide lớn + một câu ngắn + một nút hành động gợi ý. |

## 7. Văn phong UI

- Tiếng Việt, xưng hô trung tính, câu ngắn. Nút dùng động từ: "Lưu", "Thêm con", "Gửi đề xuất".
- Ngày viết `dd/MM/yyyy`. Ngày âm ghi rõ, ví dụ "12/3 âm" hoặc "12/3 (nhuận) âm".
- Lỗi đặt cạnh trường sai, nói rõ cách sửa. Không dùng thông báo chung chung.

## 8. Mã dùng ngay

### 8.1 Tailwind 4 — `@theme` (đặt trong `src/index.css`)

```css
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap");
@import "tailwindcss";

@theme {
  --font-sans: "Be Vietnam Pro", system-ui, sans-serif;

  --color-bg: #EEF3F8;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F5F7FA;
  --color-border: #E3E8EF;
  --color-primary: #24466F;
  --color-primary-hover: #1B3658;
  --color-primary-fg: #FFFFFF;
  --color-secondary: #E4ECF6;
  --color-secondary-hover: #D3E0F0;
  --color-secondary-fg: #24466F;
  --color-accent: #1C9BE6;
  --color-accent-text: #0B6FB3;
  --color-text: #0F1B2D;
  --color-text-muted: #5B6B7F;
  --color-deceased: #9AA5B1;
  --color-tree-line: #C9D3DF;
  --color-success: #1F7A45;
  --color-success-bg: #E6F6EC;
  --color-warning: #9A5B00;
  --color-warning-bg: #FFF4DE;
  --color-danger: #C5221F;
  --color-danger-bg: #FDECEA;
  --color-event-memorial: #6D4AA8;
  --color-event-birthday: #1C9BE6;
  --color-event-custom: #C77700;
  --color-header: #D6E6F5;
  --color-hero-from: #D9E8F7;
  --color-hero-to: #F7FAFD;

  --radius-button: 10px;
  --radius-field: 12px;
  --radius-card: 16px;
  --shadow-card: 0 2px 12px rgb(36 70 111 / 0.08);
  --shadow-overlay: 0 8px 24px rgb(15 27 45 / 0.16);

  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

@layer base {
  body { background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); font-size: 16px; line-height: 1.5; }
  :focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
}
```

### 8.2 Biến CSS của shadcn (map sang token trên)

```css
:root {
  --background: var(--color-bg);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --card-foreground: var(--color-text);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-text);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-fg);
  --secondary: var(--color-secondary);
  --secondary-foreground: var(--color-secondary-fg);
  --muted: var(--color-surface-muted);
  --muted-foreground: var(--color-text-muted);
  --accent: var(--color-secondary);
  --accent-foreground: var(--color-secondary-fg);
  --destructive: var(--color-danger);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-accent);
  --radius: 12px;
}
```

## 9. Mẫu điện thoại (DECISIONS #96, Đợt 46)

Lấy bố cục và cảm giác của 5 ảnh mẫu trong `image/` (header nền xanh nhạt, thẻ bo tròn bóng mềm, lưới lối tắt icon, danh sách có chevron), **không lấy nội dung** (giỏ hàng, sản phẩm, điểm). Thành phần dùng chung ở `src/components/shared/`, chỉ thêm khi ≥ 2 trang dùng.

| Thành phần | Quy cách |
|---|---|
| **Header** (`layout/Header.tsx`) | Nền `--color-header`, viền dưới mờ. Điện thoại ở `/`: logo `favicon.svg` 36px + "Tộc Phả" (20px/700 primary), **không khẩu hiệu**; tên trang vẫn có `h1` cho trình đọc màn hình. Trang khác: quay lại + tên trang. Máy tính giữ bố cục cũ. |
| **Thanh dưới** (`layout/BottomNav.tsx`) | Nền `--color-surface`, viền trên. Mục đang chọn: icon trong viên thuốc 56×32px nền `--color-secondary`, icon + chữ `--color-primary`, chữ 600. Mục khác: `--color-text-muted`, chữ 500. Mỗi mục cao ≥ 56px. |
| **`SectionCard`** | Thẻ (Card) có tiêu đề mục **18px/700 màu primary** (icon 20px tùy chọn bên trái) và link "Xem tất cả" + chevron tùy chọn bên phải (`moreTo`), chữ 14px `--color-accent-text`, vùng chạm 44px; hoặc nút tự vẽ (`action`, ví dụ "Thêm", tháng trước/sau). Padding 16px (24px ở ≥768px). Thẻ con bên trong thì bỏ bóng (danh sách ngăn bằng đường kẻ, khối viền `rounded-field`), không lồng thẻ có bóng. |
| **`FilterBar`** | Thanh lọc trong một thẻ (Thành viên, Sự kiện): điện thoại là ô tìm rồi **hàng chip có icon cuộn ngang trong thẻ** (chip `shrink-0`, giữ đủ chữ, trang không cuộn ngang); từ 768px tất cả một hàng, chip rộng cố định. |
| **`ListRow`** / **`ListGroup`** | Dòng cao ≥ 56px: icon 24px primary (hoặc phần tử `leading`) · nhãn 16px/500 + mô tả 14px muted · chevron phải (hoặc `trailing`). Có `to`/`onClick` thì cả dòng bấm được, hover `--color-surface-muted` bo 12px. Nhiều dòng bọc trong `ListGroup` (một thẻ), ngăn bằng đường kẻ `--color-border` thụt theo lề nội dung. |
| **`IconTile`** | Ô lối tắt: icon 24px trong ô 48px bo 12px nền `--color-secondary` + nhãn 14px/500 tối đa 2 dòng, căn giữa. Đặt trong lưới **4 cột** của một `SectionCard`. |
| **`StickyActions`** | Thanh nút dính ngay trên thanh dưới ở điện thoại (`sticky`, nền surface, viền trên, các nút chia đều chiều ngang); tĩnh, căn phải ở máy tính. Đặt ở cuối nội dung trang. |
| **Thẻ chào (Trang chủ)** | Không ảnh. Nền chuyển màu `--color-hero-from` → `--color-hero-to`, lời chào 24px/700 primary (theo tên tài khoản, khách chỉ "Xin chào") + một câu phụ, ô "Sự kiện gần nhất" nền surface 80% (icon loại, tên, ngày dương/âm, số ngày còn lại), 2 nút "Xem cây" (primary) và "Xem lịch" (nền surface). |

Đợt 47: **Thêm** = thẻ tài khoản (ảnh 64px, tên 20px/700 primary, email, badge vai trò, dòng "Hồ sơ cá nhân") → nhóm `SectionCard` + `ListRow`: Tiện ích · Gia đình · Quản trị (Admin) · Khác → nút Đăng xuất. **Thành viên** điện thoại: lưới 2 cột thẻ (ảnh 64px, tên tối đa 2 dòng, năm sinh – mất, badge); máy tính giữ bảng. **Hồ sơ thành viên**: nút Sửa/Xóa trong `StickyActions` ở điện thoại, đầu trang ở máy tính.

Thứ tự Trang chủ: thẻ chào → việc chờ Admin (nếu có) → "Lối tắt" (`IconTile`) → "Gia phả" (số liệu) → "Sắp tới (30 ngày)" và "Mới diễn ra" (`SectionCard` + `ListRow`).

