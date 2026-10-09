# Runbook deploy production — giapha.click

VPS Ubuntu x86_64 (4 GB RAM), IP `103.77.243.142`. Docker Compose gồm `nginx` (80/443), `app`, `mysql`, `certbot`.
Image build ở GitHub Actions, đẩy GHCR, server chỉ `pull`. Chạy local thì dùng `docker-compose.yml` ở gốc repo, không phải file trong thư mục này.

```
infra/
  docker-compose.prod.yml   chạy trên VPS (copy tự động bởi deploy.yml)
  .env.example              mẫu .env prod
  nginx/                    Dockerfile (build FE + nginx), default.conf, security-headers.conf, 40-certs.sh
  backup/backup.sh          mysqldump hằng ngày
```

## 1. Lần deploy đầu

### 1.1 DNS
Tạo 2 bản ghi **A**: `@` và `www` → `103.77.243.142`. Kiểm tra: `nslookup giapha.click` và `nslookup www.giapha.click`.

### 1.2 Cài Docker trên VPS
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # đăng xuất, đăng nhập lại
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
sudo mkdir -p /opt/giapha/backup && sudo chown -R $USER /opt/giapha
```
Không mở cổng 3306: MySQL chỉ nằm trong mạng nội bộ Docker.

### 1.3 `.env` prod
```bash
nano /opt/giapha/.env      # dán nội dung infra/.env.example rồi điền giá trị thật
chmod 600 /opt/giapha/.env
```
Sinh bí mật: `openssl rand -base64 48` (JWT), `openssl rand -base64 24` (mật khẩu DB). `ROOT_ADMIN_EMAIL` là email sẽ đăng ký đầu tiên để thành Admin. Seed 28 thành viên tự chạy qua Flyway khi app khởi động lần đầu.

### 1.4 GitHub
Settings → Secrets and variables → Actions:
- Secrets: `DEPLOY_HOST` (`103.77.243.142`), `DEPLOY_USER`, `DEPLOY_SSH_KEY` (private key của cặp khóa dùng riêng cho deploy; public key đã thêm vào `~/.ssh/authorized_keys` trên VPS).
- Variable (tùy chọn): `VITE_GOOGLE_CLIENT_ID`. Để trống thì nút Google ẩn.
- Đẩy GHCR dùng `GITHUB_TOKEN` có sẵn, không cần thêm secret. Server đăng nhập GHCR bằng chính token này mỗi lần deploy.

Chạy workflow **Deploy** (Actions → Deploy → Run workflow, hoặc `git tag v1.0.0 && git push origin v1.0.0`).
Lần đầu `nginx` chạy với chứng chỉ tự ký tạm (trình duyệt sẽ cảnh báo) cho tới bước 1.5.

### 1.5 Lấy chứng chỉ Let's Encrypt (một lần)
Chờ `docker compose -f docker-compose.prod.yml ps` báo `nginx` healthy, DNS đã trỏ đúng, rồi:
```bash
cd /opt/giapha
docker compose -f docker-compose.prod.yml run --rm --entrypoint sh certbot -c \
  "rm -rf /etc/letsencrypt/live/giapha.click && certbot certonly --webroot -w /var/www/certbot \
   -d giapha.click -d www.giapha.click --email EMAIL_CUA_BAN --agree-tos --no-eff-email"
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```
Lệnh `rm -rf` xóa chứng chỉ tạm để certbot tạo thư mục thật cùng tên. Thử trước với `--dry-run` nếu muốn tránh giới hạn của Let's Encrypt.

## 2. Gia hạn chứng chỉ
Tự động: container `certbot` chạy `certbot renew` mỗi 12 giờ, nginx nạp lại chứng chỉ mỗi 6 giờ. Kiểm tra:
```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run
docker compose -f docker-compose.prod.yml logs certbot
```

## 3. Cập nhật và quay lui
- Cập nhật: chạy lại workflow **Deploy**.
- Quay về bản cũ: đặt `IMAGE_TAG=<mã commit đầy đủ>` trong `.env`, rồi `docker compose -f docker-compose.prod.yml up -d`.
- Xem log: `docker compose -f docker-compose.prod.yml logs -f app`.
- Đổi `VITE_GOOGLE_CLIENT_ID` hay `.env` của app: biến FE nằm trong image nên phải deploy lại; biến BE chỉ cần `up -d`.

## 4. Sao lưu và khôi phục
Cài cron (giữ 30 ngày, lưu `/opt/giapha/backup`):
```bash
chmod +x /opt/giapha/backup/backup.sh     # file do workflow Deploy copy lên VPS
crontab -e
# 30 2 * * * /opt/giapha/backup/backup.sh >> /opt/giapha/backup/backup.log 2>&1
```
Chạy tay: `/opt/giapha/backup/backup.sh`. Tải về máy định kỳ (chạy ở máy bạn):
```bash
scp "<user>@103.77.243.142:/opt/giapha/backup/*.sql.gz" ./giapha-backup/
```
Khôi phục (ghi đè dữ liệu hiện tại):
```bash
cd /opt/giapha
gunzip -c backup/giapha_YYYY-MM-DD_HHMM.sql.gz | docker exec -i giapha-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose -f docker-compose.prod.yml restart app
```

## 5. Sự cố thường gặp
| Hiện tượng | Cách xử lý |
|---|---|
| `docker compose` báo `đặt … trong .env` | Thiếu biến bắt buộc trong `/opt/giapha/.env` |
| `app` unhealthy | `logs app`: thường sai `DB_PASSWORD` (đã tạo volume với mật khẩu cũ: phải xóa volume `giapha_mysql_data` hoặc đổi lại mật khẩu) hoặc `JWT_SECRET` < 32 byte |
| Không nhận OTP | `logs app \| grep -i mail`; kiểm tra `MAIL_*`, `MAIL_FROM` khớp tài khoản SMTP |
| Trình duyệt cảnh báo chứng chỉ | Chưa làm bước 1.5 hoặc certbot lỗi (DNS chưa trỏ, cổng 80 bị chặn) |
| Một tài nguyên bị chặn, console báo `Content-Security-Policy` | Thêm nguồn vào `nginx/security-headers.conf`, deploy lại |
