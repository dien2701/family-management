-- Khách nhận Web Push không cần đăng nhập (DECISIONS #89): subscription không gắn tài khoản (account_id NULL) tự giữ
-- tùy chọn nhận bản tin. Với subscription của tài khoản, các cột tùy chọn bị bỏ qua (dùng notification_pref).
ALTER TABLE push_subscription
    MODIFY account_id BIGINT NULL COMMENT 'user_account.id; NULL = subscription khách; không có FK',
    ADD COLUMN notify_events BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Khách: sự kiện chung và sinh nhật',
    ADD COLUMN notify_memorials BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Khách: ngày giỗ',
    ADD COLUMN remind_days_before JSON NOT NULL DEFAULT (JSON_ARRAY(30, 15, 7, 3, 1, 0)) COMMENT 'Khách: mốc nhắc trước, 0-30 ngày',
    ADD COLUMN remind_hour VARCHAR(5) NOT NULL DEFAULT '07:00' COMMENT 'Khách: HH:mm, giờ Asia/Ho_Chi_Minh';

-- Chống gửi trùng của khách tính theo subscription (account_id NULL). Khóa cũ theo tài khoản giữ nguyên:
-- MySQL cho phép nhiều dòng NULL nên hai khóa không chồng nhau.
ALTER TABLE notification_dispatch
    MODIFY account_id BIGINT NULL COMMENT 'user_account.id; NULL khi gửi cho subscription khách',
    ADD COLUMN subscription_id BIGINT NULL COMMENT 'push_subscription.id (khách); NULL khi gửi cho tài khoản' AFTER account_id,
    ADD UNIQUE KEY uq_notification_dispatch_subscription (subscription_id, event_key, occurrence_date, days_before);
