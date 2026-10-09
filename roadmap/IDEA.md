# ĐẶC TẢ HỆ THỐNG FAMILY MANAGEMENT (bản chốt v2)

> Cập nhật: 2026-09-25. Bản v2 **thay thế hoàn toàn** bản chốt 2026-09-24.
> Thay đổi lớn so với v1:
> - Bỏ khái niệm dòng họ (Family), hệ thống chỉ còn một gia phả chung.
> - Bỏ vai trò Manager. Tài khoản mới phải được Admin duyệt.
> - Quan hệ giữa các thành viên là nhãn tự nhập.
> - Cây gia phả do Admin dựng tay.
> - Làm toàn bộ frontend trước, sau đó mới tới backend.
>
> Các quyết định kỹ thuật đi kèm nằm ở `docs/DECISIONS.md` mục J (#54–#74).
>
> **Điều chỉnh "hồ sơ tự quản" (2026-09-25, DECISIONS mục K #75–#78):**
> - Quan hệ nhãn hai chiều được thay bằng **danh sách người thân một chiều** trong hồ sơ mỗi thành viên.
> - User đã liên kết **tự sửa trực tiếp** hồ sơ và danh sách người thân của mình, trừ các trường về việc đã mất.
> - Đề xuất chỉ còn dùng cho sự kiện chung.
>
> **Điều chỉnh "tài khoản ≠ thành viên" (2026-09-25, DECISIONS mục L #79–#82):**
> - Tài khoản (người đăng nhập) và thành viên (người trong gia phả) là hai khái niệm tách hẳn, liên kết 1–1.
> - Admin gán hoặc hủy liên kết trực tiếp được, User tự hủy được. Khi liên kết, email của tài khoản được chép một lần sang hồ sơ nếu ô email đang trống.

## 1. Tổng quan

- Web quản lý **một gia phả chung**: thành viên, người thân, cây gia phả, ngày giỗ (âm lịch), sinh nhật, sự kiện chung, nhắc lịch bằng Web Push, trợ lý AI.
- **Không có dòng họ hay tenant.** Mọi tài khoản đã được duyệt đều xem cùng một bộ dữ liệu.
- Quy mô: khoảng 1.000 tài khoản, vài trăm thành viên.
- Chỉ có tiếng Việt, múi giờ Asia/Ho_Chi_Minh.
- Là **PWA**: cài được lên điện thoại và máy tính, thiết kế ưu tiên điện thoại.

## 2. Khái niệm cốt lõi

| Khái niệm | Ý nghĩa |
|---|---|
| **Member (Thành viên)** | Một người trong gia phả, còn sống hoặc đã mất. **Chỉ họ tên là bắt buộc**, không bắt buộc có tài khoản, không bắt buộc có trên cây |
| **Người thân** | Danh sách trong hồ sơ của một thành viên. Mỗi dòng gồm một thành viên đã có cùng nhãn tự nhập, ví dụ "cha", "vợ", "chú họ". **Một chiều**: dòng trong hồ sơ B không tự hiện ở hồ sơ A. Chủ hồ sơ và Admin quản lý. Tách hẳn khỏi cây |
| **Cây gia phả** | Cấu trúc do Admin **dựng tay** bằng các nút "+". Chỉ những thành viên được đưa vào mới có trên cây. Hệ thống không tự sinh cây từ danh sách người thân |
| **Ô trên cây (node)** | Một vị trí trên cây. Ô có thể đang chứa một thành viên, hoặc là **ô trống** sau khi người trong ô bị gỡ ra |
| **UserAccount (Tài khoản)** | Người đăng ký và đăng nhập vào hệ thống. Phải được Admin duyệt mới xem được gia phả. **Có thể** liên kết với **một** Member ("Tôi là ai", §6.3); mỗi Member cũng chỉ liên kết với tối đa một tài khoản |
| **Proposal (Đề xuất)** | Thay đổi **sự kiện chung** do User đề xuất (tự soạn hoặc nhờ AI soạn), chờ Admin duyệt |

**Thuật ngữ (DECISIONS #79):** **tài khoản ≠ thành viên.**
- *Tài khoản* (user) là người dùng hệ thống.
- *Thành viên* (member) là dữ liệu nội dung của gia phả.
- Một tài khoản chỉ "là" một thành viên khi đã liên kết. Phần lớn thành viên (ví dụ 28 cụ đã mất ở Phụ lục A) không có tài khoản.
- Giao diện gọi người đăng nhập là "tài khoản", người trong gia phả là "thành viên", không dùng lẫn. Trong tài liệu, "User" viết hoa là **vai trò**, còn "tài khoản" là đối tượng.

## 3. Vai trò và phân quyền

Chỉ có hai vai trò: **Admin** và **User**. Có thể có nhiều Admin, và **mọi Admin có quyền như nhau**.

| Quyền | Admin | User |
|---|:-:|:-:|
| Duyệt, từ chối, khóa, mở khóa tài khoản | ✅ | – |
| Cấp hoặc gỡ quyền Admin cho tài khoản khác | ✅ | – |
| Thêm, xóa thành viên | ✅ | ❌ |
| Sửa hồ sơ thành viên | ✅ mọi hồ sơ, mọi trường | Chỉ hồ sơ của chính mình (cần đã liên kết), **trừ các trường về việc đã mất** (§6.1) |
| Thêm, sửa, xóa danh sách người thân | ✅ mọi hồ sơ | Chỉ hồ sơ của chính mình (cần đã liên kết), có hiệu lực ngay (§6.2) |
| Tải ảnh đại diện | ✅ | Chỉ cho hồ sơ của chính mình |
| Dựng cây (thêm, gỡ, điền ô trống, di chuyển nhánh) | ✅ | ❌ |
| Tạo, sửa, xóa sự kiện chung | ✅ | Chỉ gửi đề xuất |
| Duyệt yêu cầu liên kết "Tôi là ai" và duyệt đề xuất | ✅ | – |
| Gán thành viên cho tài khoản, hủy liên kết của tài khoản bất kỳ (§6.3) | ✅ | Chỉ gửi yêu cầu "Đây là tôi" và tự hủy liên kết của mình |
| Xem danh sách, chi tiết, cây, lịch, dashboard | ✅ | ✅ |
| Xem SĐT, email của thành viên | ✅ | Chỉ của chính mình |
| Tùy chọn thông báo của bản thân | ✅ | ✅ |
| Hỏi AI mỗi ngày | 30 câu | 15 câu |

**Admin đầu tiên (Admin gốc):**
- Được khai bằng biến môi trường `ROOT_ADMIN_EMAIL`.
- Email này đăng ký hoặc đăng nhập **khi hệ thống chưa có Admin nào** thì tự thành Admin, không cần chờ duyệt.
- Sau đó Admin gốc giống mọi Admin khác, không có quyền riêng.

**Ràng buộc bảo vệ:**
- Admin không tự gỡ quyền và không tự khóa chính mình.
- Hệ thống chặn thao tác gỡ quyền hoặc khóa **Admin cuối cùng**.

## 4. Mô hình dữ liệu (MySQL 8.4)

```
user_account(id, email UQ, password_hash NULL, google_sub NULL, full_name, avatar_url,
             system_role[ADMIN|USER],
             status[PENDING|ACTIVE|LOCKED],                 -- PENDING = chưa xác thực OTP
             approval_status[WAITING|APPROVED|REJECTED],    -- Admin duyệt
             approved_by NULL, approved_at NULL,
             member_id FK NULL UQ,                          -- "Tôi là ai"
             created_at)
user_consent(id, user_id, policy_version, accepted_at, ip)   -- đồng ý theo NĐ 13, không gắn dòng họ
email_otp(id, email, purpose[REGISTER|RESET], code_hash, expires_at, attempts)
refresh_token(id, user_id, token_hash, expires_at, revoked)

member(id,
       full_name (bắt buộc duy nhất, ghi nguyên văn), search_name, taboo_name NULL,
       gender[M|F] NULL,                                      -- được để trống
       avatar_url, phone, email, biography TEXT, labels JSON NULL,
       birth_year, birth_month, birth_day, birthday_calendar[SOLAR|LUNAR] DEFAULT SOLAR, birth_lunar_leap,
       is_deceased, death_year, death_month, death_day,        -- ngày mất theo dương (tự tính nếu nhập âm có năm)
       death_lunar_year NULL, death_lunar_day, death_lunar_month, death_lunar_leap,   -- năm âm NULL khi chỉ biết ngày/tháng
       memorial_override_day NULL, memorial_override_month NULL,
       burial_place,
       created_by, created_at, updated_at)

member_relative(id, member_id, relative_member_id,
                label VARCHAR(50),                 -- bắt buộc: trong hồ sơ member, relative_member là "label" (ví dụ "cha")
                created_by, created_at, updated_at)
                -- một chiều; UQ(member_id, relative_member_id); không tự thêm chính mình

tree_node(id, member_id NULL UQ,                   -- NULL = ô trống
          parent_node_id NULL,                     -- ô cha/mẹ trong dòng; NULL = gốc hoặc ô vợ/chồng
          co_parent_node_id NULL,                  -- vợ/chồng của parent, tức cha/mẹ còn lại (nếu có)
          sort_order,                              -- thứ tự anh em / thứ tự các gốc
          created_at, updated_at)
tree_spouse(id, node_id, spouse_node_id UQ, spouse_order)   -- ô vợ/chồng đứng cạnh node, 1=Cả, 2=Hai…

member_link_request(id, user_id, member_id, status[PENDING|APPROVED|REJECTED], reviewed_by, created_at)

custom_event(id, title, description, calendar[SOLAR|LUNAR],
             day, month, is_leap, year NULL(=lặp hằng năm), location, created_by)

proposal(id, author_id, source[MANUAL|AI], action[CREATE|UPDATE|DELETE],
         target_type[EVENT], target_id NULL,
         payload JSON, diff JSON, base_updated_at, status[PENDING|APPROVED|REJECTED],
         reviewer_id, review_note, created_at, reviewed_at)

notification(id, user_id, type, title, body, link, created_at, read_at)
push_subscription(id, user_id, endpoint UQ, p256dh, auth, user_agent, last_ok_at)
notification_pref(user_id PK, enable_memorial, enable_birthday, enable_custom,
                  offsets JSON([30,7,3,1,0]), send_hour DEFAULT 7)
notification_dispatch(user_id, event_key, occurrence_date, offset, UQ(cả 4 cột))

attachment(id, member_id NULL (NULL = tài liệu chung), kind[AVATAR|DOCUMENT], url, public_id, mime, size, title, uploaded_by)
ai_usage(user_id, usage_date, count, PK(user_id, usage_date))
ai_message(id, user_id, role, content, created_at)
system_setting(key PK, value)
audit_log(id, actor_id, action, target_type, target_id, before_data JSON, after_data JSON, created_at)
```

**Nguyên tắc:**
- **Họ tên ghi đúng như nguồn**, kể cả các chữ như "Cụ", "Ông", "Bà", "Tổ cô" hay "(Tức Cụ Kai)". Hệ thống không tách tiền tố và không tự thêm tiền tố.
- **Không tự đặt giới tính.** Trường nào chưa biết thì để trống, có thông tin thì bổ sung sau.
- **Danh sách người thân và cây độc lập với nhau.**
  - Thêm hay sửa người thân không làm thay đổi cây.
  - Dựng cây không thêm người thân vào hồ sơ nào.
- **Đời được tính từ độ sâu trên cây**, không lưu trong bảng `member`.
- **Sinh nhật và giỗ không lưu thành sự kiện.** Hệ thống tính từ `member` mỗi khi cần.
- `audit_log` ghi mọi thay đổi dữ liệu gia phả và thao tác quản trị. Không có màn hình xem lịch sử, và audit log không bao giờ bị xóa.

## 5. Tài khoản và duyệt

- **Đăng ký:** gồm họ tên, email, mật khẩu, xác nhận mật khẩu và tick đồng ý chính sách. Hệ thống gửi **OTP 6 số qua email**:
  - hiệu lực 10 phút;
  - nhập sai tối đa 5 lần;
  - sau 60 giây mới được gửi lại.
- **Đăng nhập:** bằng email/mật khẩu hoặc **Google**.
  - Access token JWT hiệu lực 15 phút.
  - Refresh token hiệu lực 30 ngày, lưu trong cookie HttpOnly.
- **Quên mật khẩu:** nhập email, nhận OTP, đặt mật khẩu mới. Mọi refresh token bị thu hồi.
- **Duyệt tài khoản:**
  - Tài khoản xác thực xong OTP (hoặc đăng nhập Google lần đầu) có trạng thái **Chờ duyệt** (`WAITING`).
  - Người chờ duyệt đăng nhập được, nhưng chỉ thấy trang **"Đang chờ Admin duyệt"** (có nút đăng xuất). Trang này tự kiểm tra lại trạng thái định kỳ.
  - Admin **duyệt** thì người đó dùng được app. Admin **từ chối** thì người đó thấy trang "Tài khoản không được duyệt". Admin có thể duyệt lại một tài khoản đã bị từ chối.
  - Mọi API nghiệp vụ chỉ nhận tài khoản đã được duyệt. Tài khoản chưa duyệt gọi vào thì nhận 403.
- **Khóa tài khoản:** Admin khóa thì người đó không đăng nhập được và bị thu hồi mọi refresh token.
- **Đồng ý dữ liệu cá nhân (Nghị định 13/2023):**
  - Người đăng ký bằng email tick đồng ý ngay ở form đăng ký.
  - Người đăng nhập Google lần đầu phải tick đồng ý ở trang chờ duyệt.
  - Hệ thống lưu lại phiên bản chính sách mà người đó đã đồng ý.
  - Có trang **Chính sách bảo mật**.
- **Sau khi đăng nhập:**
  - Chờ duyệt: vào trang chờ duyệt.
  - Bị từ chối: vào trang báo không được duyệt.
  - Đã duyệt: vào Tổng quan. Admin có thêm mục menu **"Quản trị"**, dùng chung khung app, không có khu vực riêng.
- **Báo lỗi:**
  - Lỗi hiện ngay tại trường nhập tương ứng.
  - Đăng nhập sai thì chỉ báo lỗi chung.
  - Sai 5 lần thì khóa đăng nhập 15 phút.

## 6. Chức năng theo module

### 6.1 Thành viên
- **Danh sách:** hiện dạng bảng trên máy tính, dạng thẻ trên điện thoại.
  - Sắp xếp theo: tên A–Z, tuổi, thời gian thêm, đời.
  - Tìm theo tên, **không cần gõ dấu**.
  - Lọc theo: khoảng tuổi, đời, còn sống/đã mất, **có trên cây/chưa có trên cây**.
- **Ai được sửa:**
  - Admin thêm, sửa, xóa mọi thành viên.
  - User đã liên kết "Tôi là ai" **tự sửa trực tiếp** hồ sơ của mình, có hiệu lực ngay, không cần duyệt. User sửa được mọi trường **trừ nhóm "đã mất"**: ô "Đã qua đời", ngày mất (âm/dương, cờ nhuận), ngày giỗ ghi đè, nơi an táng. Nhóm này chỉ Admin sửa.
  - User không thêm và không xóa thành viên. Mọi thay đổi ghi audit log, Admin không nhận thông báo.
- **Form:**
  - Họ tên là trường bắt buộc duy nhất.
  - Giới tính được phép để trống.
  - Nơi an táng, ngày mất và ngày giỗ chỉ hiện khi chọn "Đã qua đời".
  - Ngày mất nhập được theo âm hoặc dương. Nếu có năm thì hệ thống tự đổi sang lịch còn lại. Nếu chỉ có ngày/tháng âm (không có năm) thì vẫn lưu được, và không hiện "giỗ lần thứ N".
  - Không có ngày mất thì để trống toàn bộ các trường về thời gian mất.
  - Ngày sinh được phép chỉ có năm. Sinh nhật tính theo Dương (mặc định) hoặc Âm, chọn riêng cho từng người.
  - Có ảnh đại diện, tên húy, nhãn đặc biệt (ví dụ "Liệt sỹ"), tiểu sử, SĐT, email. Email và SĐT của thành viên là dữ liệu của hồ sơ, tách khỏi email đăng nhập của tài khoản. Riêng email được tự điền một lần khi liên kết (§6.3).
  - Khi User sửa hồ sơ của mình, form ẩn hoặc khóa nhóm "đã mất".
- **Xóa thành viên (chỉ Admin):**
  - **Bị chặn nếu người đó đang có trên cây.** Admin phải gỡ người đó khỏi cây trước.
  - Khi xóa, hệ thống xóa danh sách người thân của người đó, và gỡ người đó khỏi danh sách người thân của mọi hồ sơ khác. Những thành viên kia vẫn giữ nguyên.
  - Tài khoản đang liên kết với người đó bị gỡ liên kết, tài khoản vẫn còn.
  - Tệp đính kèm của người đó bị xóa, kể cả trên Cloudinary.
  - Audit log lưu **bản sao đầy đủ** (member, các dòng người thân liên quan, danh sách tệp). Admin xem lại được ở trang "Thành viên đã xóa".
- **Trang chi tiết:**
  - thông tin cá nhân (SĐT và email chỉ hiện với Admin và chính chủ);
  - khối **Người thân** (§6.2);
  - khối **Trên cây**: đời, cha/mẹ, vợ/chồng và con **theo cây**, kèm nút "Xem trên cây";
  - tệp đính kèm.

### 6.2 Người thân (danh sách trong hồ sơ)
- Mỗi hồ sơ thành viên có một danh sách **"Người thân"**. Mỗi dòng gồm một thành viên đã có trong danh sách thành viên, cùng một **nhãn** tự nhập nói người đó là gì của chủ hồ sơ, ví dụ "cha", "vợ", "chú họ".
- Trên hồ sơ B, bấm **"Thêm người thân"**, chọn A (tìm không dấu, không chọn được chính B), nhập nhãn. Hồ sơ B hiện "A — cha".
- **Một chiều:** dòng này chỉ nằm trong hồ sơ B. Hồ sơ A không tự có dòng nào về B. Nếu muốn, A tự thêm B vào danh sách của mình với nhãn riêng.
- Ràng buộc: một người chỉ xuất hiện **một lần** trong danh sách của một hồ sơ (muốn đổi nhãn thì sửa dòng cũ), không thêm chính mình, nhãn bắt buộc và dài tối đa 50 ký tự. Không có ràng buộc nào khác.
- **Ai quản lý:**
  - Chủ hồ sơ (User đã liên kết "Tôi là ai") tự thêm, sửa, xóa danh sách của mình, có hiệu lực ngay.
  - Admin quản lý danh sách của mọi hồ sơ.
- **Ai xem:** mọi tài khoản đã duyệt xem được danh sách người thân trên hồ sơ của bất kỳ ai. Mỗi tên là link tới hồ sơ người đó.
- Muốn thêm một người **chưa có** trong danh sách thành viên thì nhờ Admin tạo trước.
- Mọi thay đổi ghi audit log, không gửi thông báo.

### 6.3 Liên kết "Tôi là ai"
- Quan hệ **1–1**: một tài khoản liên kết tối đa một thành viên, một thành viên có tối đa một tài khoản (DECISIONS #80).
- **Cách 1, User gửi yêu cầu:** tài khoản đã được duyệt tìm thành viên (tìm không dấu) rồi bấm "Đây là tôi". Hệ thống tạo `member_link_request`. Admin duyệt thì gán `user.member_id`.
- **Cách 2, Admin gán trực tiếp:** ở Quản trị > Tài khoản, Admin bấm "Gán thành viên" trên một tài khoản đã duyệt, không cần yêu cầu. Yêu cầu "Đây là tôi" đang chờ của tài khoản đó tự hủy. Người được gán nhận thông báo như khi được duyệt liên kết.
- Không liên kết được với thành viên đã có tài khoản khác. Tài khoản đã liên kết muốn đổi người thì phải hủy liên kết trước.
- **Hủy liên kết:** User tự hủy của mình; Admin hủy được của bất kỳ tài khoản nào ở Quản trị > Tài khoản.
- **Chép email (DECISIONS #81):** khi liên kết có hiệu lực (bằng cách 1 hoặc 2), nếu hồ sơ chưa có email thì email của tài khoản được chép sang. Hồ sơ đã có email thì giữ nguyên. Chỉ chép một lần: sau đó sửa email hồ sơ không đổi email đăng nhập. Không chép SĐT, họ tên, ảnh. Hủy liên kết không xóa email đã chép.
- Tài khoản bị khóa hoặc bị từ chối vẫn giữ liên kết. Admin tự hủy nếu cần (DECISIONS #82).
- Liên kết xong thì User mới **tự sửa** được hồ sơ, danh sách người thân và ảnh đại diện của mình (§6.1, §6.2). Chưa liên kết thì User chỉ xem.

### 6.4 Cây gia phả (xem mục 8)

### 6.5 Sự kiện và lịch
- **Ba loại sự kiện:**
  - **Giỗ:** của người đã mất có ngày mất âm (hoặc ngày giỗ ghi đè).
  - **Sinh nhật:** của người còn sống có ngày/tháng sinh, theo âm hoặc dương tùy người.
  - **Sự kiện chung:** lặp hằng năm theo âm hoặc dương, hoặc chỉ diễn ra một lần. Admin tạo và sửa, User gửi đề xuất.
- **Danh sách sắp diễn ra:**
  - Khoảng thời gian: 7, 15, 30, 90 ngày hoặc cả năm.
  - Lọc theo loại, sắp xếp gần nhất hoặc xa nhất.
  - Mỗi dòng ghi kiểu "còn N ngày", "giỗ lần thứ N", "tròn N tuổi".
- **Lịch tháng:**
  - Mỗi ô ngày hiện ngày dương lớn, ngày âm nhỏ và chấm màu theo loại sự kiện.
  - Có nút gạt để xem chính theo lịch âm.
  - Bấm vào ngày thì hiện danh sách sự kiện của ngày đó.
  - Trên điện thoại hiển thị dạng danh sách theo tuần.

### 6.6 Đề xuất và phê duyệt
- **Đề xuất chỉ dùng cho sự kiện chung:** User đề xuất thêm, sửa, xóa sự kiện chung. Không cần liên kết "Tôi là ai".
- Hồ sơ và danh sách người thân của chính mình thì User **tự sửa trực tiếp** (§6.1, §6.2), không qua đề xuất. Không có đề xuất cho hồ sơ người khác, cho thêm thành viên mới hay cho cây.
- Đề xuất được lưu dạng payload kèm **diff trước/sau**. User gửi từ trang lịch hoặc nhờ AI soạn.
- **Admin có hàng đợi đề xuất** (hiện số đang chờ). Với mỗi đề xuất, Admin có thể:
  - xem diff;
  - duyệt, có thể chỉnh nhẹ trước khi duyệt;
  - từ chối kèm lý do.

  Người đề xuất nhận được thông báo kết quả.
- **Kiểm tra xung đột:** nếu sự kiện đã bị sửa sau `base_updated_at` thì hệ thống cảnh báo Admin.
- **Cây không nhận đề xuất.** Chỉ Admin được dựng cây.

### 6.7 Tệp đính kèm
- Ảnh, PDF và giấy tờ gắn vào một thành viên hoặc vào mục **Tài liệu chung**, lưu trên **Cloudinary**.
- Mỗi file tối đa 10 MB. **Toàn hệ thống tối đa 1 GB.**
- Chỉ nhận các định dạng jpg, png, webp, pdf, docx, xlsx.
- Chỉ Admin được tải lên và xóa. Ngoại lệ: User đã liên kết được tải **ảnh đại diện** cho hồ sơ của chính mình (jpg, png, webp, tối đa 10 MB, ảnh cũ bị thay). Mọi tài khoản đã duyệt đều xem được.

### 6.8 Dashboard
- Các thẻ số liệu:
  - tổng thành viên;
  - còn sống/đã mất;
  - số người có trên cây;
  - số đời (đời sâu nhất trên cây).
- Sự kiện gần nhất sắp tới, có đếm ngược.
- 10 sự kiện vừa diễn ra gần nhất.
- Danh sách sự kiện trong 30 ngày tới.
- Admin thấy thêm số tài khoản chờ duyệt, số đề xuất chờ duyệt và số yêu cầu liên kết chờ duyệt.

### 6.9 Export
- **Excel:** danh sách thành viên, danh sách sự kiện trong năm.
- **PDF:**
  - danh sách thành viên;
  - lịch giỗ cả năm (theo tháng âm).
- **In cây:** sơ đồ cây khổ A3/A2 dạng PDF, hoặc ảnh PNG.
- **Không có nhập hàng loạt từ Excel.**

### 6.10 Quản trị (menu "Quản trị", chỉ Admin)
- **Tài khoản:**
  - danh sách Chờ duyệt và Tất cả, có ô tìm;
  - duyệt, từ chối;
  - khóa, mở khóa;
  - cấp hoặc gỡ quyền Admin;
  - xem thành viên đang liên kết của từng tài khoản, "Gán thành viên" và "Hủy liên kết" (§6.3).
- **Yêu cầu liên kết** và **Đề xuất**: hàng đợi duyệt.
- **Thành viên đã xóa:** xem bản sao trong audit log.
- **Cấu hình hệ thống:**
  - phiên bản chính sách;
  - lượt hỏi AI của User và Admin;
  - dung lượng tối đa mỗi file;
  - tổng dung lượng.

## 7. Quy tắc lịch âm (bắt buộc đúng)

- **Thuật toán:** thuật toán đổi lịch âm–dương của **Hồ Ngọc Đức**.
  - Bản Java là nguồn chuẩn, bản TS phải cho kết quả y hệt.
  - Dùng múi giờ UTC+8 trước năm 1968 và UTC+7 từ năm 1968.
  - Có bộ đối chiếu cho giai đoạn 1900–2100 ở `shared/fixtures/lunar/`.
- **Ngày giỗ trong năm âm Y** xác định theo thứ tự ưu tiên:
  1. Nếu Admin đã ghi đè ngày cúng thì dùng ngày đó.
  2. Nếu người mất vào **tháng nhuận** thì cúng vào **tháng thường cùng số**.
  3. Nếu năm Y **tháng thiếu, không có ngày 30** thì cúng ngày 29.
- **Sinh nhật:**
  - Sinh nhật âm dùng cùng quy tắc tháng nhuận và ngày 30.
  - Sinh nhật dương 29/2: năm không nhuận thì dời sang 28/2.
- Sự kiện chung theo lịch âm dùng cùng quy tắc.

## 8. Cây gia phả (dựng tay)

**Nguyên tắc:**
- Cây **không tự sinh**. Lúc đầu cây trống.
- Admin đưa từng thành viên vào cây bằng các nút "+". Mỗi thành viên có trên cây **tối đa một lần**.
- Một cây có thể gồm **nhiều gốc**. Các gốc đứng ngang hàng ở Đời 01, và có thể nối với nhau như vợ chồng hoặc không nối.
- **Đời = độ sâu trên cây**:
  - gốc là Đời 01;
  - ô vợ/chồng đứng cùng hàng, cùng đời với người kia;
  - mỗi cây rời tính đời riêng.

**Bố cục:**

```
Đời 01   [Vợ Cả ⚭1] ── [Người gốc] ── [⚭2 Vợ Hai]          [Gốc thứ hai]   ← nhiều gốc ngang hàng
               │                           │
Đời 02     [Con A]                  [ ░ô trống░ ]              ← ô trống viền đứt
                                           │
Đời 03                                 [Cháu B]

 Ô thành viên: ┌──────────────────────────────┐
               │ (ảnh) Cụ Nguyễn Văn Sửu       │  ← họ tên nguyên văn, không thêm tiền tố
               │      ✝ 11/7/1955 âm          │  ← viền xám và ✝ nếu đã mất
               └──────────────────────────────┘
```

**Quy tắc vẽ:**
- **Cột trái cố định hiện "Đời 01…N"**. Mỗi đời nằm trên một hàng ngang.
- Vợ/chồng đứng cạnh nhau. Người có nhiều vợ/chồng thì các vợ/chồng xếp hai bên theo thứ tự (Cả, Hai…).
- Đường nối con đi xuống từ **đúng cặp cha–mẹ** (`parent_node_id` + `co_parent_node_id`). Nếu không có cặp thì nối từ một mình cha hoặc mẹ. Anh em xếp theo `sort_order`.
- Ô trống vẽ viền đứt, không có tên. Con cháu của ô trống vẫn nối vào ô đó.
- Ô của người chưa có giới tính vẽ trung tính, không đoán giới tính.

**Dựng cây (chỉ Admin):**
- Cây trống thì hiện nút **"+ Thêm người gốc"**. Admin thêm được nhiều gốc.
- Mỗi ô có ba nút "+":
  - **"+" phía dưới: thêm Con.** Nếu người này có từ 2 vợ/chồng trở lên, Admin **chọn đó là con với ai**. Nếu có đúng 1 vợ/chồng thì tự nhận cặp đó. Bấm "+" dưới trên ô vợ/chồng thì con thuộc về cặp đó.
  - **"+" bên cạnh: thêm Vợ/Chồng**, đứng cùng hàng. Chỉ có trên ô thuộc dòng, không có trên ô vợ/chồng.
  - **"+" phía trên: thêm Cha/Mẹ.** Chỉ có trên ô **ở Đời 01** thuộc dòng (gốc). Người mới trở thành gốc, và toàn bộ cây rời đó dịch xuống một đời.
- Bấm bất kỳ nút "+" nào cũng mở hộp chọn **thành viên chưa có trên cây** (tìm không dấu).
- **Gỡ khỏi cây:**
  - Ô trở thành **ô trống** nằm đúng chỗ cũ, con cháu và vợ/chồng không bị ảnh hưởng.
  - Thành viên vẫn còn nguyên trong danh sách.
  - Bấm vào ô trống để chọn một thành viên khác điền vào.
- **Xóa ô trống:** chỉ làm được khi ô trống không còn con và không còn vợ/chồng.
- **Di chuyển nhánh:**
  - Một ô thuộc dòng được chuyển đi kèm toàn bộ vợ/chồng và con cháu.
  - Nơi đến có thể là làm con của một ô khác (chọn cặp cha–mẹ nếu cần), hoặc thành gốc mới.
  - Hệ thống chặn nếu nơi đến nằm trong chính nhánh đang chuyển.
  - Trên máy tính dùng kéo thả, trên điện thoại dùng menu "Di chuyển nhánh".
- **Đổi thứ tự:** đổi thứ tự anh em (sang trái/phải), và đổi cặp cha–mẹ của một người con.

**Thao tác xem (mọi người):**
- Phóng to/thu nhỏ, kéo, thu gọn hoặc mở rộng từng nhánh.
- Ô tìm kiếm: gõ tên để nhảy tới người đó và làm nổi bật.
- "Xem cây từ người này" (chọn gốc bất kỳ) và **"Xem tổ tiên của tôi"** (cần đã liên kết và người đó có trên cây).
- **Trên điện thoại:** mặc định hiện 3 đời quanh người được chọn, chạm để mở rộng, dùng hai ngón để phóng to/thu nhỏ.
- **Menu khi bấm vào ô:**
  - Mọi người thấy "Xem hồ sơ" và "Xem cây từ người này".
  - Admin thấy thêm "Gỡ khỏi cây", "Di chuyển nhánh", "Đổi thứ tự", "Đổi cặp cha–mẹ", và "Xóa ô" (với ô trống).

**Kỹ thuật:**
- Dùng **React Flow** để hiển thị.
- Tự viết thuật toán xếp vị trí theo hàng đời, dạng hàm thuần. Đơn vị xếp là ô cùng các vợ/chồng của nó.
- Khi in thì dùng lại chính layout đó.

## 9. Thông báo (không dùng email)

1. **PWA + Web Push (VAPID)**: phía Spring Boot dùng thư viện `nl.martijndwars:web-push`. Push hoạt động trên Android, máy tính và iOS từ 16.4 trở lên (iOS cần đã thêm app vào màn hình chính).
2. **Trung tâm thông báo trong app:** biểu tượng chuông có số chưa đọc.
3. **Hướng dẫn bật thông báo** riêng cho từng loại thiết bị. Trang Cài đặt có trạng thái "Thiết bị này: đã/chưa nhận thông báo" và nút "Gửi thử".
4. **Lịch gửi:** có job chạy mỗi giờ.
   - Với từng tài khoản đã duyệt đến giờ `send_hour` (mặc định 7h), hệ thống gom các sự kiện rơi đúng mốc 30/7/3/1 ngày và ngay trong ngày, **gộp thành 1 bản tin**.
   - Loại hoặc mốc nào user đã tắt thì bị bỏ khỏi bản tin. Không còn mục nào thì không gửi.
   - Bảng `notification_dispatch` chống gửi trùng. Subscription trả về lỗi 404/410 thì bị xóa.
5. **Thông báo nghiệp vụ:**
   - Admin nhận thông báo khi có tài khoản mới chờ duyệt, đề xuất mới, hoặc yêu cầu liên kết mới.
   - User nhận thông báo khi được duyệt tài khoản, khi có kết quả liên kết (kể cả khi được Admin gán trực tiếp), và khi có kết quả đề xuất.
6. Mỗi người tự bật/tắt từng loại (giỗ, sinh nhật, sự kiện chung), từng mốc nhắc và chọn giờ nhận.

## 10. Trợ lý AI

- **Nhà cung cấp:** **Google Gemini, API gói trả phí**, đặt sau interface `AiProvider`.
- **Trả lời dạng streaming** qua SSE.
- AI **chỉ đọc** dữ liệu thông qua các hàm (function calling):
  - `searchMembers`
  - `getMember`
  - `getRelatives`: danh sách người thân trong hồ sơ, cộng với cha mẹ, vợ chồng, con **theo cây**
  - `getTreePath`: tổ tiên và con cháu trên cây
  - `upcomingEvents`
  - `lunarConvert`
  - `stats`
- **Không bao giờ gửi số điện thoại hay email lên AI.**
- **Hỗ trợ soạn đề xuất:**
  - AI gọi `draftProposal` (chỉ đề xuất sự kiện chung, §6.6), backend tạo **thẻ xem trước** kèm diff.
  - Người dùng muốn sửa hồ sơ hoặc người thân của mình thì AI hướng dẫn tự sửa trên trang hồ sơ.
  - Thẻ có nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Admin).
  - **AI không bao giờ tự ghi dữ liệu.**
- **Ngoài phạm vi:** câu hỏi không liên quan tới gia phả, lịch hay sự kiện thì AI từ chối lịch sự và gợi ý những câu có thể hỏi.
- **Giới hạn lượt hỏi:** 15 câu/ngày với User, 30 câu/ngày với Admin. Đặt lại lúc 0h giờ Việt Nam.

## 11. Kiến trúc kỹ thuật

**Backend:** Spring Boot 4.1, Java 21, Modular Monolith (Spring Modulith).
```
auth(+account approval, admin roles) · member(+relative, link request) · tree · calendar(lunar, occurrences)
event · proposal · notification(push, inbox, scheduler) · file · ai · report(export) · admin(settings, deleted) · common(audit, security, consent)
```
- **Công cụ:** Spring Security + JWT, Flyway, JPA, MapStruct, Bean Validation, Apache POI, OpenPDF, springdoc OpenAPI.
- Mọi API nghiệp vụ yêu cầu tài khoản đã được duyệt. Quyền Admin được kiểm tra ở Service hoặc `@PreAuthorize`, không chỉ ở giao diện.

**Hợp đồng API:** file `shared/api/openapi.yaml` viết tay là **nguồn sự thật**.
- Frontend sinh kiểu TypeScript từ file này.
- Backend phải khớp file này, và có test hợp đồng để kiểm tra.

**Frontend:** React 19 + Vite + TypeScript, TanStack Query, React Router, React Hook Form + Zod, Tailwind + shadcn/ui, React Flow, vite-plugin-pwa.
- Thiết kế ưu tiên điện thoại. Trên điện thoại có thanh điều hướng dưới, trên máy tính có sidebar.
- **Chế độ giả lập (`VITE_API_MODE=mock`):** dùng trong giai đoạn làm frontend trước.
  - Các endpoint chưa có backend được phục vụ bởi lớp giả lập theo đúng `openapi.yaml`.
  - Dữ liệu lưu trong localStorage, khởi tạo từ dữ liệu thật ở `shared/fixtures/seed/members.json`.
  - Đăng nhập và tài khoản luôn gọi backend thật.

**Hạ tầng:**
- **Server:** VPS thuê (Ubuntu x86_64, 4 GB RAM), Docker Compose chạy nginx + app + MySQL 8.4 + certbot (DECISIONS #87).
- **Tên miền:** `giapha.click` (kèm `www`), HTTPS bằng Let's Encrypt.
- **Lưu file:** Cloudinary.
- **Sao lưu:** backup DB hằng ngày, lưu trên ổ VPS, giữ 30 ngày.

**Cấu hình bí mật** (biến môi trường): `GEMINI_API_KEY`, khóa VAPID, Cloudinary, Google OAuth, `MAIL_*`, `JWT_SECRET`, mật khẩu DB. Thêm `ROOT_ADMIN_EMAIL` (không phải bí mật, nhưng vẫn cấu hình qua biến môi trường).

## 12. Yêu cầu phi chức năng

- **Hiệu năng:** trang tải dưới 2 giây trên mạng 4G. Cây 500 ô vẫn kéo mượt.
- **Audit log:** ghi lại mọi thay đổi dữ liệu gia phả, thao tác dựng cây và thao tác quản trị. Khi xóa thành viên thì lưu bản sao đầy đủ. Không xóa audit log.
- **Bảo mật:**
  - Mật khẩu băm bằng BCrypt.
  - Rate limit cho OTP, đăng nhập và AI.
  - Tài khoản chưa duyệt không đọc được dữ liệu gia phả.
- **Truy cập:** đạt chuẩn WCAG AA, cỡ chữ nền từ 16px trở lên, đủ tương phản cho người lớn tuổi.

## 13. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| **Đã xong (Đợt 0–7)** | Nền tảng BE/FE, Auth (OTP, Google), dòng họ (sẽ bị gỡ), lịch âm BE + FE |
| **Chuẩn bị (Đợt 8)** | Backend nhỏ: Admin gốc, duyệt tài khoản, consent không gắn dòng họ |
| **A. Frontend (Đợt 9–25)** | Hợp đồng API + lớp giả lập + dữ liệu 28 người, bỏ dòng họ ở FE, tài khoản và duyệt, thành viên (User tự sửa hồ sơ của mình), người thân, "Tôi là ai", cây (layout, hiển thị, dựng tay), lịch và sự kiện, dashboard, đề xuất sự kiện, thông báo, đính kèm, quản trị, AI, export và in cây, PWA |
| **B. Backend (Đợt 26–38)** | Gỡ dòng họ + test hợp đồng, thành viên + seed, người thân + liên kết, cây, file, sự kiện + lịch nhắc, dashboard + quản trị, đề xuất sự kiện, thông báo, Web Push, AI, export |
| **C. Nối và phát hành (Đợt 39–41)** | Nối FE với BE thật và gỡ lớp giả lập, deploy production (E2E đã bỏ, DECISIONS #84) |

## 14. Việc còn chờ

- Nhà cung cấp email gửi OTP chính thức.
- Chính sách bảo mật: bản nháp cần người có trách nhiệm pháp lý duyệt.

## Phụ lục A. Dữ liệu ban đầu (28 thành viên)

Nguồn: danh sách viết tay do người dùng cung cấp (2026-09-25), gồm 27 dòng. Riêng dòng 27 được tách thành 2 người.

Quy ước chung:
- **Mọi người đều đã mất.**
- **Ngày mất là ngày âm, không nhuận.** Nếu có năm thì hệ thống tự tính thêm ngày dương.
- **Nơi an táng của mọi người:** "Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội".
- Mọi trường khác để trống: giới tính, ngày sinh, người thân, vị trí trên cây.
- Họ tên ghi nguyên văn. Chỉ bỏ khoảng trắng thừa, ví dụ "( Tức" được sửa thành "(Tức".

| # | Họ tên (nguyên văn) | Ngày mất âm (ngày/tháng/năm) |
|---|---|---|
| 1 | Cụ Nguyễn Văn Tham (Tức Cụ Kai) | – |
| 2 | Cụ Kai Nhất | – |
| 3 | Cụ Phí Thị Giản (Tức Cụ Kai Nhị) | – |
| 4 | Cụ Nguyễn Văn Sửu | 11/7/1955 |
| 5 | Cụ Nguyễn Thị Thêm | 01/11 (không có năm) |
| 6 | Cụ Nguyễn Văn Tỵ | – |
| 7 | Cụ Nguyễn Văn Thân | 18/6/1980 |
| 8 | Cụ Nguyễn Thị Dậu | 21/10/1986 |
| 9 | Cụ Nguyễn Văn Uyên | 21/4/1986 |
| 10 | Bà Trần Thị Nhung | 29/12/2010 |
| 11 | Ông Nguyễn Văn Tân | 03/01/1999 |
| 12 | Bà Nguyễn Thị Mít | 02/01/2016 |
| 13 | Ông Nguyễn Văn Dương | 06/3/1999 |
| 14 | Bà Nguyễn Thị Khương | 13/2/2015 |
| 15 | Tổ cô Nguyễn Thị Bảy | 13/3/1946 |
| 16 | Nguyễn Văn Thông | 29/12/2004 |
| 17 | Nguyễn Văn Dân | 16/12/2019 |
| 18 | Nguyễn Văn Kỷ | 12/08/1987 |
| 19 | Nguyễn Văn Toàn | 06/05/2020 |
| 20 | Nguyễn Văn Thành | 02/05/2025 |
| 21 | Nguyễn Long | 01/06/2019 |
| 22 | Dương Thu Hương | 02/02/1994 |
| 23 | Nguyễn Thị Hải | 09/08/1971 |
| 24 | Nguyễn Mạnh Cường | 13/10/2010 |
| 25 | Nguyễn Quang Hưng | 03/7/2020 |
| 26 | Nguyễn Thị Hằng | 24/08/1989 |
| 27a | Cô bé đỏ | – |
| 27b | Cậu bé đỏ | – |
