# ĐẶC TẢ HỆ THỐNG FAMILY MANAGEMENT (bản chốt)

> Cập nhật: 2026-09-24. Bản này gộp mọi quyết định đã thống nhất và thay thế các bản trước.

## 1. Tổng quan

- Web quản lý **gia phả dòng họ**: cây gia phả, ngày giỗ (âm lịch), sinh nhật, sự kiện chung, nhắc lịch bằng Web Push, trợ lý AI.
- **Nhiều dòng họ trên cùng hệ thống**, dữ liệu mỗi dòng họ (Family) tách biệt hoàn toàn.
- **Một user chỉ thuộc 1 family.** Không có bộ chuyển family.
- Quy mô: khoảng 1.000 user. Mỗi family có khoảng 10 tài khoản đăng nhập, cây có thể lên tới vài trăm người.
- Chỉ có tiếng Việt, múi giờ Asia/Ho_Chi_Minh.
- Là **PWA**: cài được lên điện thoại và máy tính, thiết kế ưu tiên điện thoại.

## 2. Khái niệm cốt lõi

| Khái niệm | Ý nghĩa |
|---|---|
| **Family** | Một dòng họ hoặc một ngành, ví dụ "Ngành trưởng Đặng tộc – Vĩnh Bảo, Hải Phòng" |
| **Branch (Chi)** | Nhóm dùng để lọc và sắp xếp, không tô màu riêng |
| **Member** | Một người trong gia phả (còn sống hoặc đã mất), **không bắt buộc có tài khoản** |
| **UserAccount** | Người đăng nhập. Thuộc tối đa 1 Family, có thể liên kết với 1 Member ("đây là tôi") |
| **Proposal** | Đề xuất thêm/sửa/xóa của User (tự soạn hoặc nhờ AI soạn), chờ Manager duyệt |

## 3. Vai trò và phân quyền

| Quyền | System Admin | Family Manager | User |
|---|:-:|:-:|:-:|
| Quản lý mọi user và family, cấu hình hệ thống | ✅ | – | – |
| **Khóa / mở khóa Member (theo nhánh)** | ✅ | ❌ | ❌ |
| **Xóa cứng Member** | ✅ | ❌ | ❌ |
| Tạo family (người tạo trở thành Manager) | ✅ | ✅ | ✅ |
| Mời thành viên bằng link/mã | ✅ | ✅ | – |
| Chuyển quyền Manager cho người khác | ✅ | ✅ | – |
| Thêm, sửa Member, quan hệ, chi, sự kiện chung | ✅ | ✅ | ❌ (chỉ gửi đề xuất) |
| Duyệt / từ chối đề xuất | ✅ | ✅ | – |
| Xem cây, danh sách, lịch, dashboard | ✅ | ✅ | ✅ |
| Xem SĐT, email của thành viên | ✅ | ✅ | Chỉ của chính mình |
| Tùy chọn thông báo của bản thân | ✅ | ✅ | ✅ |
| Hỏi AI mỗi ngày | 30 câu | 30 câu | 15 câu |

- **Mỗi family có đúng 1 Manager.** Muốn đổi Manager thì phải chuyển quyền, Manager hiện tại trở thành User. Manager không được rời family khi chưa chuyển quyền.
- Manager không có kênh gửi yêu cầu khóa hoặc xóa lên Admin.

## 4. Mô hình dữ liệu (MySQL 8)

```
user_account(id, email UQ, password_hash NULL, google_sub NULL, full_name, avatar_url,
             system_role[ADMIN|USER], status[PENDING|ACTIVE|LOCKED], lock_reason[MANUAL|MEMBER_LOCKED] NULL,
             family_id FK NULL, family_role[MANAGER|MEMBER], member_id FK NULL,
             hide_maternal_line BOOL DEFAULT false,   -- nhớ lựa chọn "Ẩn dòng ngoại"
             created_at)
user_consent(id, user_id, family_id, policy_version, accepted_at, ip)   -- đồng ý theo NĐ 13
email_otp(id, email, purpose[REGISTER|RESET], code_hash, expires_at, attempts)
refresh_token(id, user_id, token_hash, expires_at, revoked)

family(id, name, origin_place, description, cover_url, created_by, created_at)
family_invitation(id, family_id, code UQ, expires_at, created_by)
member_link_request(id, user_id, member_id, status[PENDING|APPROVED|REJECTED], reviewed_by)
branch(id, family_id, name, root_member_id NULL, sort_order)

member(id, family_id, branch_id NULL,
       full_name (bắt buộc duy nhất), taboo_name, gender[M|F],
       avatar_url, phone, email, biography TEXT, labels JSON(["Liệt sỹ","Chết trẻ"]),
       lineage[NOI|DAU_RE|NGOAI],
       birth_year, birth_month, birth_day,             -- được phép thiếu
       birthday_calendar[SOLAR|LUNAR] DEFAULT SOLAR,
       is_deceased, death_year, death_month, death_day,
       death_lunar_day, death_lunar_month, death_lunar_leap,
       memorial_override_day NULL, memorial_override_month NULL,
       burial_place, prefix_override NULL,
       father_id NULL, mother_id NULL, child_type[RUOT|NUOI|RIENG], birth_order,
       generation INT (tính sẵn),
       locked BOOL, lock_source[DIRECT|INHERITED] NULL, lock_root_id NULL, locked_by, locked_at,
       created_at, updated_at)

marriage(id, husband_id, wife_id, wife_order(1=Cả,2=Hai…), status[ACTIVE|DIVORCED|WIDOWED])

custom_event(id, family_id, title, description, calendar[SOLAR|LUNAR],
             day, month, is_leap, year NULL(=lặp hằng năm), location, created_by)

proposal(id, family_id, author_id, source[MANUAL|AI], action[CREATE|UPDATE|DELETE],
         target_type[MEMBER|MARRIAGE|EVENT|BRANCH], target_id NULL,
         payload JSON, diff JSON, base_updated_at, status[PENDING|APPROVED|REJECTED],
         reviewer_id, review_note, created_at, reviewed_at)

notification(id, user_id, type, title, body, link, created_at, read_at)
push_subscription(id, user_id, endpoint UQ, p256dh, auth, user_agent, last_ok_at)
notification_pref(user_id PK, enable_memorial, enable_birthday, enable_custom,
                  offsets JSON([30,7,3,1,0]), send_hour DEFAULT 7)
notification_dispatch(user_id, event_key, occurrence_date, offset, UQ(cả 4 cột))

attachment(id, family_id, member_id NULL, url, public_id, mime, size, title, uploaded_by)
ai_usage(user_id, usage_date, count, PK(user_id, usage_date))
ai_message(id, user_id, role, content, created_at)
audit_log(id, family_id, actor_id, action, target_type, target_id, before JSON, after JSON, at)
```

Nguyên tắc:
- **Anh/chị/em không lưu riêng**, hệ thống suy ra từ cha/mẹ chung.
- **Con gắn với cặp cha–mẹ cụ thể** (`father_id` + `mother_id`), nhờ đó vẽ đúng con của bà Cả và con của bà Hai.
- **Sinh nhật và giỗ không lưu thành sự kiện.** Hệ thống tính từ `member` mỗi khi cần.
- `generation` được tính lại khi quan hệ cha mẹ thay đổi. Dâu/rể lấy cùng đời với vợ/chồng.
- Mọi truy vấn nghiệp vụ mặc định **loại bỏ member có `locked = true`**.

## 5. Khóa và xóa Member (chỉ System Admin)

### 5.1 Khóa
- Admin khóa một người thì **cả nhánh** bị khóa theo: người đó, toàn bộ con cháu và dâu/rể của những người trong nhánh.
  - Người được chọn khóa có `lock_source = DIRECT`. Những người bị khóa theo có `INHERITED` và `lock_root_id` trỏ về người được chọn khóa.
- Hậu quả của việc khóa:
  - Ẩn khỏi cây, danh sách, tìm kiếm và AI.
  - Không được tính vào thống kê.
  - Không được nhắc giỗ hay sinh nhật.
  - **Tài khoản liên kết với người bị khóa cũng bị khóa đăng nhập** (`lock_reason = MEMBER_LOCKED`) và bị thu hồi mọi refresh token.
- **Nếu nhánh có chứa Manager:** hệ thống chặn thao tác khóa. Admin phải chuyển quyền Manager cho người ngoài nhánh trước.
- Trang quản trị có danh sách member bị khóa, xem được theo từng nhánh.

### 5.2 Mở khóa
- Mở khóa người gốc thì mở lại toàn bộ những người bị khóa theo (`INHERITED`, cùng `lock_root_id`).
- Người trong nhánh **đã bị khóa riêng từ trước** (`DIRECT`) thì **vẫn giữ trạng thái khóa**.
- Tài khoản liên kết được mở lại nếu trước đó bị khóa vì lý do `MEMBER_LOCKED`.

### 5.3 Xóa
- **Xóa cứng** khỏi database.
- **Chỉ xóa được người chưa có con.** Nếu người đó có con thì hệ thống chặn thao tác và gợi ý dùng Khóa.
- Nếu người đó còn vợ/chồng, hệ thống **tự gỡ quan hệ hôn nhân** rồi mới xóa.
- Nếu người đó có tài khoản liên kết thì tài khoản được gỡ liên kết (`member_id = NULL`), tài khoản không bị xóa.
- **Audit log giữ lại bản sao đầy đủ** (member, các quan hệ hôn nhân và file đính kèm) để tra cứu hoặc khôi phục khi xóa nhầm.

## 6. Chức năng theo module

### 6.1 Auth
- **Đăng ký:** họ tên, email, mật khẩu, xác nhận mật khẩu, đồng ý điều khoản. Hệ thống gửi **OTP 6 số qua email**:
  - hiệu lực 10 phút;
  - nhập sai tối đa 5 lần;
  - sau 60 giây mới được gửi lại.

  Nhập đúng OTP thì tài khoản chuyển sang ACTIVE.
- **Đăng nhập:** bằng email/mật khẩu hoặc **Google OAuth** (email Google được coi là đã xác thực). Access token JWT hiệu lực 15 phút, refresh token hiệu lực 30 ngày, lưu trong cookie HttpOnly.
- **Quên mật khẩu:** nhập email, nhận OTP, đặt mật khẩu mới, đồng thời thu hồi mọi refresh token.
- **Báo lỗi:**
  - Lỗi hiện ngay tại trường nhập tương ứng.
  - Khi đăng nhập sai, hệ thống chỉ báo lỗi chung, không để lộ email có tồn tại hay không.
  - Sai 5 lần thì khóa đăng nhập 15 phút.
- **Sau khi đăng nhập:**
  - Người chưa có family vào màn hình "Tạo dòng họ / Nhập mã mời".
  - Người đã có family vào Dashboard.
  - Admin vào khu quản trị.
- Nhà cung cấp email gửi OTP: **sẽ cung cấp sau**. Code gửi mail được tách qua interface `MailSender`.

### 6.2 Family, lời mời, dữ liệu cá nhân
- **Tạo family:** nhập tên dòng họ, quê quán, mô tả, ảnh bìa.
- **Mời thành viên:**
  - Manager tạo **link hoặc mã mời**, hết hạn sau 7 ngày.
  - Nút "Chia sẻ" dùng Web Share API hoặc sao chép link. **Không tích hợp Zalo API.**
  - Người nhận có thể mở link, hoặc nhập mã vào màn hình "Nhập mã mời".
- **Đồng ý dữ liệu cá nhân (Nghị định 13/2023):** **mỗi user** phải tick đồng ý khi tham gia hoặc tạo family. Hệ thống lưu lại phiên bản chính sách mà người đó đã đồng ý.
- Có **trang Chính sách bảo mật**, ghi rõ:
  - dữ liệu nào được thu thập;
  - ai được xem;
  - dữ liệu được lưu trên Cloudinary;
  - dữ liệu được xử lý bởi Gemini (gói trả phí);
  - cách yêu cầu sửa hoặc xóa dữ liệu.
- Với Member, chỉ **họ tên là bắt buộc**, mọi trường khác đều có thể để trống.
- **Liên kết tài khoản:** khi tham gia, user chọn "Tôi là ai trong cây". Hệ thống tạo một `member_link_request` và Manager phải duyệt.

### 6.3 Thành viên
- **Danh sách:** hiện dạng bảng trên máy tính, dạng thẻ trên điện thoại.
  - Sắp xếp theo: tên A–Z, tuổi từ lớn đến bé, thời gian thêm, chi, đời.
  - Tìm kiếm theo:
    - tên (không cần gõ dấu);
    - khoảng tuổi;
    - chi;
    - đời;
    - còn sống/đã mất.
- **Form:**
  - Họ tên là trường bắt buộc duy nhất.
  - Nơi chôn cất, ngày mất và ngày giỗ chỉ hiện khi chọn "Đã qua đời".
  - Ngày mất nhập được theo âm hoặc dương, hệ thống tự đổi sang lịch còn lại.
  - Ngày sinh được phép chỉ có năm.
  - Có lựa chọn **sinh nhật theo Dương (mặc định) hoặc Âm** cho từng người.
- **Trang chi tiết:**
  - thông tin cá nhân;
  - quan hệ: cha mẹ, vợ chồng, con, anh chị em;
  - tệp đính kèm;
  - lịch sử thay đổi.

### 6.4 Cây gia phả (xem mục 8)

### 6.5 Sự kiện và lịch
- **Ba loại sự kiện:**
  - **Giỗ:** của người đã mất, theo âm lịch.
  - **Sinh nhật:** của người còn sống, theo âm hoặc dương tùy người.
  - **Sự kiện chung:** lặp hằng năm theo âm hoặc dương, hoặc chỉ diễn ra một lần.
- **Danh sách sắp diễn ra:**
  - Khoảng thời gian: 7, 15, 30, 90 ngày hoặc cả năm.
  - Lọc theo loại: tất cả, giỗ, sinh nhật, sự kiện chung.
  - Sắp xếp: gần nhất hoặc xa nhất.
  - Mỗi dòng ghi kiểu "còn N ngày", "giỗ lần thứ N", "tròn N tuổi".
- **Lịch tháng:**
  - Mỗi ô ngày hiện ngày dương lớn, ngày âm nhỏ và chấm màu theo loại sự kiện.
  - Có nút gạt để xem chính theo lịch âm.
  - Bấm vào ngày thì hiện danh sách sự kiện của ngày đó.
  - Trên điện thoại hiển thị dạng danh sách theo tuần.

### 6.6 Đề xuất và phê duyệt
- User bấm "Đề xuất…" ngay trên trang thành viên hoặc trên cây, hoặc nhờ AI soạn. Đề xuất được lưu dạng payload kèm **diff trước/sau**.
- Manager có hàng đợi đề xuất (hiện số đang chờ). Với mỗi đề xuất, Manager có thể:
  - xem diff;
  - duyệt, có thể chỉnh nhẹ trước khi duyệt;
  - từ chối kèm lý do.

  Người đề xuất nhận được thông báo kết quả.
- **Kiểm tra xung đột:** nếu bản ghi đã bị sửa sau `base_updated_at` thì hệ thống cảnh báo Manager.
- Đề xuất loại DELETE của User chỉ nhằm báo cho Manager. Việc xóa hay khóa thật vẫn do Admin làm.

### 6.7 Tệp đính kèm
- Ảnh, PDF, giấy tờ gắn vào thành viên hoặc family, lưu trên **Cloudinary**.
- Mỗi file tối đa 10 MB, mỗi family tối đa 1 GB.
- Chỉ nhận các định dạng jpg, png, webp, pdf, docx, xlsx.

### 6.8 Dashboard (dùng chung)
- Các thẻ số liệu:
  - tổng thành viên;
  - còn sống/đã mất;
  - số đời;
  - số chi.
- Sự kiện gần nhất sắp tới, có đếm ngược.
- 10 sự kiện vừa diễn ra gần nhất.
- Danh sách sự kiện trong 30 ngày tới.
- Manager thấy thêm số đề xuất và yêu cầu liên kết đang chờ duyệt.

### 6.9 Export và Import
- **Excel:** danh sách thành viên, danh sách sự kiện trong năm.
- **PDF:**
  - danh sách thành viên;
  - lịch giỗ cả năm (theo tháng âm);
  - **sơ đồ cây khổ A3/A2 hoặc ảnh PNG** để in (giai đoạn 3).
- **Nhập hàng loạt từ Excel (giai đoạn 3):**
  - Dùng file mẫu có các cột: họ tên, giới tính, năm sinh, tên cha, tên mẹ, tên vợ/chồng, đời, ngày giỗ âm.
  - Mẫu chi tiết sẽ được chốt khi bắt đầu giai đoạn 3.

### 6.10 Trang quản trị System Admin
- Quản lý user: tìm kiếm, khóa/mở khóa tài khoản.
- Quản lý family: xem danh sách, chuyển quyền Manager.
- **Khóa và mở khóa nhánh member**, xem danh sách member đang bị khóa.
- **Xóa cứng member**, xem bản sao của những người đã xóa trong audit log.
- Cấu hình hệ thống.

## 7. Quy tắc lịch âm (bắt buộc đúng)

- **Thuật toán:** tự cài thuật toán đổi lịch âm–dương của **Hồ Ngọc Đức** trong Java, dùng **múi giờ +7**. Có bộ test đối chiếu cho giai đoạn 1900–2100.
- **Ngày giỗ trong năm âm Y** được xác định theo thứ tự ưu tiên:
  1. Nếu Manager đã ghi đè ngày cúng thì dùng ngày đó.
  2. Nếu người mất vào **tháng nhuận** thì cúng vào **tháng thường cùng số**. Năm có tháng nhuận đó cũng vẫn cúng vào tháng thường.
  3. Nếu năm Y **tháng thiếu, không có ngày 30** thì cúng ngày 29.
- **Sinh nhật:**
  - Sinh nhật âm dùng cùng quy tắc tháng nhuận và ngày 30.
  - Sinh nhật dương 29/2: năm không nhuận thì dời sang 28/2.
- Sự kiện chung theo lịch âm dùng cùng quy tắc.

## 8. Cây gia phả

**Bố cục:**

```
Đời 01   [Nguyễn Thị Cườm ⚭1] ── [Đặng Công Định] ── [⚭2 Nguyễn Thị Huối]
               │                                            │
Đời 02   [Đặng Văn Chuẩn]=[Đặng Thị Lan]     [Liệu] [Đình] [Tính] [Biền] [Viêu] ...
               │
Đời 03   [Đặng Văn Chấn]=[Đỗ Thị Êm]
         ┌─────┼──────┬───────┐
Đời 04  [Đài]=[Bầu] [Đường] [Thắm] ...

 Ô thành viên: ┌──────────────────────┐
               │ (ảnh) Cụ Đặng Văn Đài │
               │      1890 – 1965 ✝   │  ← viền xám và ✝ nếu đã mất
               │      [Liệt sỹ]        │  ← nhãn đặc biệt
               └──────────────────────┘
```

**Quy tắc vẽ:**
- **Cột trái cố định hiện "Đời 01…N"**. Mỗi đời nằm trên một hàng ngang.
- Vợ/chồng đứng cạnh nhau. Người có nhiều vợ/chồng thì xếp hai bên theo thứ tự vợ Cả, vợ Hai…
- Đường nối con đi xuống từ **đúng cặp cha–mẹ**. Anh em sắp xếp theo `birth_order`.
- Dâu/rể có ô riêng nhưng không vẽ tổ tiên bên họ.
- **Dòng ngoại:** mặc định **hiện đầy đủ**, gồm con gái, con rể đứng cạnh và con của con gái. Có **một nút gộp "Ẩn dòng ngoại"** để ẩn con rể và cháu ngoại. Hệ thống **nhớ lựa chọn của từng user** (`hide_maternal_line`).
- Nhánh bị khóa không được vẽ.
- **Tiền tố xưng hô** được tính theo khoảng cách đời với người đang xem:
  - cách từ 3 đời trở lên: "Cụ";
  - cách 2 đời: "Ông/Bà";
  - còn lại: không có tiền tố.

  Manager có thể sửa tay (`prefix_override`). **Tài khoản chưa liên kết Member thì không hiện tiền tố** (trừ khi đã có `prefix_override`).

**Thao tác:**
- Phóng to/thu nhỏ, kéo, thu gọn hoặc mở rộng từng nhánh.
- Ô tìm kiếm: gõ tên để nhảy tới người đó và làm nổi bật.
- "Xem cây từ người này" (chọn gốc bất kỳ) và "Xem tổ tiên của tôi".
- **Trên điện thoại:** mặc định hiện 3 đời quanh người được chọn, chạm để mở rộng, dùng hai ngón để phóng to/thu nhỏ.
- **Menu khi bấm vào ô:**
  - Manager thấy "+ Con", "+ Vợ/Chồng", "+ Cha/Mẹ", "Sửa", mỗi mục mở form tương ứng.
  - User thấy cùng menu đó nhưng các mục thành "Đề xuất…".
  - Admin thấy thêm "Khóa nhánh" và "Xóa".

**Kỹ thuật:**
- Dùng **React Flow** để hiển thị.
- Tự viết thuật toán xếp vị trí theo hàng đời, trong đó đơn vị xếp là **cặp vợ chồng**.
- Khi xuất bản in thì dùng lại chính layout đó.

## 9. Thông báo (không dùng email)

1. **PWA + Web Push (VAPID)**: phía Spring Boot dùng thư viện `nl.martijndwars:web-push`. Push hoạt động trên Android, máy tính và iOS 16.4 trở lên (iOS cần đã thêm app vào màn hình chính).
2. **Trung tâm thông báo trong app:** biểu tượng chuông có số chưa đọc, luôn có dữ liệu kể cả khi push thất bại.
3. **Hướng dẫn bật thông báo:** lần đầu đăng nhập, hệ thống hiện hướng dẫn riêng cho từng loại thiết bị. Trang Cài đặt có:
   - trạng thái "Thiết bị này: đã/chưa nhận thông báo";
   - nút "Gửi thử".
4. **Lịch gửi:** có job chạy mỗi giờ.
   - Với từng user đến giờ `send_hour` (mặc định 7h), hệ thống gom các sự kiện rơi đúng mốc 30/7/3/1 ngày và **ngay trong ngày**, **gộp thành 1 bản tin**.
   - **Loại hoặc mốc nào user đã tắt thì bị bỏ khỏi bản tin.** Nếu không còn mục nào thì không gửi.
   - Ví dụ: "Còn 3 ngày: Giỗ cụ Đặng Văn Đài (12/3 âm); Hôm nay: sinh nhật Đặng Minh Quân".
   - Bảng `notification_dispatch` chống gửi trùng.
   - Subscription trả về lỗi 404/410 thì bị xóa.
5. Mỗi người tự bật/tắt từng loại (giỗ, sinh nhật, sự kiện chung), từng mốc nhắc và chọn giờ nhận.
6. **Nâng cấp sau này (tùy chọn):** bọc app bằng Capacitor + FCM để push ổn định hơn trên iPhone.

## 10. Trợ lý AI

- **Nhà cung cấp:** **Google Gemini, API gói trả phí** (đã có `GEMINI_API_KEY`, đọc từ biến môi trường, không commit vào repo). Code được tách qua interface `AiProvider` để sau này có thể đổi nhà cung cấp.
- **Trả lời dạng streaming** (chữ hiện dần ra) qua SSE.
- AI **chỉ đọc** dữ liệu của family người hỏi, thông qua function calling với các hàm:
  - `searchMembers`
  - `getMember`
  - `getRelatives`
  - `upcomingEvents`
  - `lunarConvert`
  - `stats`

  AI không truy vấn thẳng vào DB. Member bị khóa không bao giờ được trả về cho AI.
- **Không bao giờ gửi số điện thoại hay email lên AI**, bất kể người hỏi có quyền xem hay không.
- **Hỗ trợ thao tác:**
  - AI gọi `draftProposal`, backend tạo **thẻ xem trước** gồm diff.
  - Thẻ có nút "Gửi đề xuất" (với User) hoặc "Áp dụng" (với Manager).
  - **AI không bao giờ tự ghi dữ liệu.**
- **Ngoài phạm vi:** câu hỏi không liên quan đến gia phả, lịch hay sự kiện của family thì AI từ chối lịch sự và gợi ý những câu có thể hỏi.
- **Giới hạn lượt hỏi:**
  - 15 câu/ngày với User, 30 câu/ngày với Manager và Admin.
  - Đặt lại lúc 0h giờ Việt Nam.
  - Giao diện hiện số câu còn lại, hết lượt thì khóa ô nhập.

## 11. Kiến trúc kỹ thuật

**Backend:** Spring Boot 3, Java 21, Modular Monolith, mỗi module là một package.
```
auth · family · member(+relationship, generation, lock) · tree(layout DTO) · calendar(lunar, occurrences)
event · proposal · notification(push, inbox, scheduler) · file · ai · report(export/import) · admin · common(audit, security, consent)
```
- **Công cụ:** Spring Security + JWT, Flyway, JPA, MapStruct, Bean Validation, Apache POI, OpenPDF, springdoc OpenAPI.
- Mọi truy vấn bắt buộc lọc theo `family_id` lấy từ token, và có test chặn truy cập chéo giữa các family.

**Frontend:** React + Vite + TypeScript, TanStack Query, React Router, React Hook Form + Zod, Tailwind + shadcn/ui, React Flow, vite-plugin-pwa.
- Thiết kế ưu tiên điện thoại.
- Bố cục: thanh điều hướng dưới trên điện thoại, sidebar trên máy tính.

**Hạ tầng (dùng miễn phí trước):**
- **Server:** Oracle Cloud Always Free (ARM 4 nhân, 24 GB RAM), chạy Spring Boot + MySQL 8 + Nginx.
- **Tên miền:** DuckDNS (ví dụ `giapha.duckdns.org`), HTTPS bằng **Let's Encrypt** (bắt buộc để Web Push hoạt động). Sau này có thể chuyển sang tên miền `.id.vn`/`.io.vn`.
- **Lưu file:** Cloudinary.
- **Sao lưu:** backup DB hằng ngày.

**Cấu hình bí mật** (biến môi trường): `GEMINI_API_KEY`, khóa VAPID, thông tin Cloudinary, Google OAuth, SMTP (cung cấp sau), JWT secret.

## 12. Yêu cầu phi chức năng

- **Hiệu năng:** trang tải dưới 2 giây trên mạng 4G. Cây 500 người vẫn kéo mượt.
- **Audit log:**
  - Ghi lại mọi thay đổi dữ liệu gia phả.
  - Với thao tác xóa cứng, lưu bản sao đầy đủ của dữ liệu trước khi xóa.
  - Không xóa audit log.
- **Bảo mật:**
  - Mật khẩu băm bằng BCrypt.
  - Rate limit cho OTP, đăng nhập và AI.
- **Truy cập:** đạt chuẩn WCAG AA, cỡ chữ nền từ 16px trở lên, đủ tương phản cho người lớn tuổi.

## 13. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| **1. Lõi** | Auth (OTP, Google), đồng ý NĐ 13 + trang Chính sách bảo mật, Family và mã mời, liên kết "Tôi là ai", Member, quan hệ, chi, **cây gia phả** (kèm "+ Con", "+ Vợ/Chồng" ngay trên cây, nút "Ẩn dòng ngoại"), thư viện lịch âm, sự kiện, danh sách sắp tới, lịch tháng, Dashboard, PWA |
| **2. Tương tác** | Đề xuất và duyệt, Web Push, trung tâm thông báo, tùy chọn thông báo, tệp đính kèm, audit log |
| **3. Nâng cao** | Trợ lý AI (Gemini), export Excel/PDF, **in cây khổ lớn**, nhập hàng loạt từ Excel, trang quản trị System Admin (khóa/xóa member, quản lý user và family) |

> **Lưu ý về giai đoạn:** khóa và xóa member thuộc trang quản trị ở giai đoạn 3. Tuy vậy, **các cột dữ liệu và bộ lọc `locked` được tạo ngay từ giai đoạn 1** để sau này không phải sửa lại truy vấn.

## 14. Việc còn chờ

- Nhà cung cấp email gửi OTP: user sẽ cung cấp sau.
- Mẫu file Excel để nhập: chốt ở giai đoạn 3.
