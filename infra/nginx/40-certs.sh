#!/bin/sh
# Chạy trước khi nginx khởi động (docker-entrypoint.d).
set -e

LIVE=/etc/letsencrypt/live/giapha.click

# Lần đầu chưa có chứng chỉ thật: tạo chứng chỉ tự ký để nginx lên được và trả lời thử thách ACME.
# Runbook xóa thư mục này trước khi certbot cấp chứng chỉ thật.
if [ ! -f "$LIVE/fullchain.pem" ]; then
  mkdir -p "$LIVE"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$LIVE/privkey.pem" -out "$LIVE/fullchain.pem" -subj "/CN=giapha.click"
fi

# certbot tự gia hạn vào volume dùng chung; nginx nạp lại chứng chỉ mỗi 6 giờ
( while :; do sleep 6h; nginx -s reload; done ) &
