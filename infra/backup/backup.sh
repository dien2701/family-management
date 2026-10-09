#!/bin/sh
# Sao lưu MySQL: dump -> gzip -> /opt/giapha/backup, xóa bản cũ hơn 30 ngày.
# Mật khẩu root lấy từ biến môi trường BÊN TRONG container, không xuất hiện trên host.
#
# Cron (crontab -e, mỗi ngày 02:30 giờ VPS):
#   30 2 * * * /opt/giapha/backup/backup.sh >> /opt/giapha/backup/backup.log 2>&1
#
# Tải bản sao về máy (chạy trên máy của bạn):
#   scp -r <user>@103.77.243.142:/opt/giapha/backup/*.sql.gz ./giapha-backup/
set -eu

DIR=/opt/giapha/backup
OUT="$DIR/giapha_$(date +%F_%H%M).sql.gz"
mkdir -p "$DIR"

# --single-transaction: dump nhất quán, không khóa bảng
docker exec giapha-mysql sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --no-tablespaces "$MYSQL_DATABASE"' \
  | gzip > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"

find "$DIR" -name 'giapha_*.sql.gz' -mtime +30 -delete
echo "$(date -Is) OK $OUT ($(du -h "$OUT" | cut -f1))"
