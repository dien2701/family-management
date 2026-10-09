# 🚀 Hướng Dẫn Triển Khai Hệ Thống Tộc Phả Lên Máy Chủ (Server / VPS)

> **Deploy production (giapha.click) xem [`infra/README.md`](infra/README.md).** Tài liệu dưới đây chỉ dành cho chạy thử bằng `docker-compose.yml` ở gốc repo (build tại chỗ, không có HTTPS).

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng **Tộc Phả** lên máy chủ thực tế (VPS / Cloud Server như Oracle Cloud, DigitalOcean, AWS, Linode, v.v.) bằng Docker Compose.

---

## 🏗️ 1. Kiến Trúc Triển Khai

Hệ thống được đóng gói thành 3 dịch vụ chính chạy trong cùng mạng nội bộ Docker:

```
Người dùng / Domain (Port 80/443)
            │
            ▼
┌────────────────────────────────────────────────────────┐
│  giapha-frontend (Nginx Container)                    │
│  - Phục vụ Web tĩnh React 19 SPA (PWA)                │
│  - Reverse Proxy: /api/* ───┐                          │
└─────────────────────────────┼──────────────────────────┘
                              │ (nội bộ: 8080)
                              ▼
┌────────────────────────────────────────────────────────┐
│  giapha-backend (Spring Boot, Java 21)                │
│  - Tự động chạy Flyway migration (V1 -> V16)          │
│  - Kết nối DB ──────────────┐                          │
└─────────────────────────────┼──────────────────────────┘
                              │ (nội bộ: 3306)
                              ▼
┌────────────────────────────────────────────────────────┐
│  giapha-mysql (MySQL 8.4 LTS)                         │
│  - Lưu trữ dữ liệu an toàn qua Docker Volume          │
└────────────────────────────────────────────────────────┘
```

---

## 📋 2. Yêu Cầu Máy Chủ (Prerequisites)

- **Hệ điều hành:** Ubuntu 22.04+ / Debian 12+ / Oracle Linux (x86_64 hoặc ARM64).
- **Cấu hình tối thiểu:** 2 CPU Cores, 2GB RAM (khuyến nghị 4GB RAM trở lên).
- **Phần mềm cần cài trước:**
  - Docker Engine (v24.0+): [Hướng dẫn cài Docker](https://docs.docker.com/engine/install/)
  - Docker Compose (v2.20+): Thường đi kèm sẵn khi cài Docker.
- **Tường lửa (Firewall / Security Group):** Mở các cổng `80` (HTTP) và `443` (HTTPS).

---

## 🛠️ 3. Các Bước Triển Khai Chi Tiết

### Bước 1: Sao chép mã nguồn lên server

Trên máy chủ, tạo thư mục và clone mã nguồn:

```bash
git clone https://github.com/dien2701/family-management.git /var/www/family-management
cd /var/www/family-management
```

---

### Bước 2: Tạo và cấu hình file môi trường `.env`

Sao chép file mẫu:

```bash
cp .env.example .env
```

Mở file `.env` bằng `nano` hoặc `vim` để điền cấu hình:

```bash
nano .env
```

**Bảng giải thích các biến môi trường quan trọng:**

| Biến                     | Ý nghĩa                                          | Giá trị mẫu                                  |
| :----------------------- | :----------------------------------------------- | :------------------------------------------- |
| `PORT`                   | Cổng web mở ra ngoài server                      | `80`                                         |
| `DB_NAME`                | Tên database MySQL                               | `giapha`                                     |
| `DB_USERNAME`            | Tên user kết nối MySQL                           | `giapha`                                     |
| `DB_PASSWORD`            | Mật khẩu database (đặt mật khẩu mạnh)            | `MatKhauDbBaoMat!@#123`                      |
| `DB_ROOT_PASSWORD`       | Mật khẩu root của MySQL                          | `MatKhauRootBaoMat!@#123`                    |
| `JWT_SECRET`             | Khóa bí mật JWT (>= 32 byte)                     | Tạo bằng lệnh: `openssl rand -base64 48`     |
| `ROOT_ADMIN_EMAIL`       | Email Admin đầu tiên (tự duyệt quyền Admin)      | `admin@example.com`                          |
| `SPRING_PROFILES_ACTIVE` | Profile chạy backend (bật prod để gửi mail SMTP) | `prod`                                       |
| `MAIL_HOST`              | Địa chỉ máy chủ SMTP                             | `smtp.gmail.com`                             |
| `MAIL_PORT`              | Cổng máy chủ SMTP                                | `587`                                        |
| `MAIL_USERNAME`          | Tài khoản gửi mail                               | `<tài khoản SMTP>`                           |
| `MAIL_PASSWORD`          | Mật khẩu ứng dụng của mail                       | `<mật khẩu ứng dụng, không commit>`          |
| `MAIL_FROM`              | Địa chỉ người gửi (phải khớp với username)       | `<địa chỉ gửi>`                              |

> 💡 **Mẹo:** Sinh khóa `JWT_SECRET` an toàn bằng lệnh:
>
> ```bash
> openssl rand -base64 48
> ```

---

### Bước 3: Khởi chạy toàn bộ hệ thống

Chạy lệnh sau để Docker tự động build mã nguồn và khởi động các container:

```bash
docker compose up -d --build
```

---

### Bước 4: Kiểm tra trạng thái hệ thống

1. **Xem danh sách container:**

   ```bash
   docker compose ps
   ```

   _Cả 3 service `giapha-mysql`, `giapha-backend`, `giapha-frontend` phải ở trạng thái `Up` hoặc `Up (healthy)`._

2. **Kiểm tra log khởi động backend:**
   ```bash
   docker compose logs -f backend
   ```
   _Khi thấy dòng `Started GiaPhaApplication in ... seconds` là backend đã kết nối DB, chạy Flyway migration thành công và sẵn sàng phục vụ._

---

## 🌐 4. Hướng Dẫn Trỏ Tên Miền (Domain & SSL)

### Cách 1: Sử dụng Cloudflare Proxy (Đơn giản & Khuyến nghị nhất ⭐)

1. Thêm tên miền vào Cloudflare.
2. Tại mục **DNS Management**, tạo bản ghi **A**:
   - **Type:** `A`
   - **Name:** `@` (hoặc subdomain như `giapha`)
   - **IPv4 address:** `<Địa_chỉ_IP_máy_chủ_của_bạn>`
   - **Proxy status:** Bật đám mây màu cam 🟧 **Proxied**.
3. Tại mục **SSL/TLS**: Chọn chế độ **Full** hoặc **Flexible**.
   👉 Người dùng truy cập qua `https://yourdomain.com` sẽ tự động có chứng chỉ SSL miễn phí và chuyển tiếp tới cổng 80 của máy chủ.

---

### Cách 2: Sử dụng Nginx trên máy chủ Host + Certbot (Let's Encrypt)

Nếu server của bạn đang có sẵn Nginx để chạy nhiều website khác:

1. Đổi cổng của ứng dụng trong file `.env`:
   ```ini
   PORT=3000
   ```
   Chạy lại: `docker compose up -d`
2. Cấu hình Nginx trên host (`/etc/nginx/sites-available/giapha.conf`):

   ```nginx
   server {
       listen 80;
       server_name giapha.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Kích hoạt và cấp chứng chỉ SSL tự động:
   ```bash
   sudo ln -s /etc/nginx/sites-available/giapha.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d giapha.yourdomain.com
   ```

---

## 👤 5. Khởi Tạo Tài Khoản Quản Trị Viên (Admin) Đầu Tiên

1. Truy cập vào địa chỉ website: `http://<IP_hoặc_Domain>`
2. Bấm vào nút **Đăng ký**:
   - Nhập đúng email đã khai báo ở `ROOT_ADMIN_EMAIL` (ví dụ: `admin@example.com`).
   - Đặt mật khẩu cho tài khoản.
3. Nhận mã OTP:
   - Hệ thống sẽ gửi mã OTP 6 số qua SMTP vào hòm thư email của bạn.
   - Nhập mã OTP vào trang web để kích hoạt.
4. **Kết quả:** Tài khoản này sẽ tự động được gán quyền **ADMIN** cao nhất và tự động được phê duyệt. Bạn có thể bắt đầu quản lý gia phả ngay lập tức.

---

## 🔄 6. Quy Trình Cập Nhật Ứng Dụng (Khi có code mới)

Khi có bản cập nhật mã nguồn mới trên Git, bạn chỉ cần chạy chuỗi lệnh sau trên server:

```bash
cd /var/www/family-management
git pull origin main
docker compose up -d --build
```

Docker sẽ tự động rebuild frontend và backend, sau đó restart dịch vụ mà **không làm mất dữ liệu** trong database.

---

## 💾 7. Sao Lưu và Khôi Phục Dữ Liệu (Backup & Restore)

### Sao lưu (Backup DB ra file .sql):

```bash
docker exec -t giapha-mysql mysqldump -u giapha -p"MatKhauDbBaoMat!@#123" giapha > backup_$(date +%F).sql
```

### Khôi phục (Restore từ file .sql):

```bash
docker exec -i giapha-mysql mysql -u giapha -p"MatKhauDbBaoMat!@#123" giapha < backup_2026-10-08.sql
```

---

## ❓ 8. Các Sự Cố Thường Gặp & Cách Khắc Phục

| Hiện tượng                                       | Nguyên nhân                                             | Cách xử lý                                                                                                                               |
| :----------------------------------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Lỗi `bind: address already in use` (Port 80)** | Máy chủ đã có service khác (Apache/Nginx) chiếm cổng 80 | Đổi `PORT=3000` (hoặc cổng khác) trong `.env` rồi chạy lại `docker compose up -d`                                                        |
| **Không nhận được mã OTP qua email**             | Sai thông tin SMTP hoặc mật khẩu ứng dụng               | Kiểm tra log gửi mail: `docker compose logs backend \| grep -i mail`. Với Office 365, cần đảm bảo `MAIL_FROM` trùng với `MAIL_USERNAME`. |
| **Backend tự động restart liên tục**             | `JWT_SECRET` bị thiếu hoặc < 32 ký tự                   | Mở `.env`, tạo lại chuỗi `JWT_SECRET` dài >= 32 byte rồi chạy `docker compose up -d backend`                                             |
