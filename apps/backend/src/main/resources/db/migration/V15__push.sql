-- Web Push (IDEA §9, DECISIONS #46): subscription của từng thiết bị và chống gửi trùng bản tin theo mốc nhắc.
CREATE TABLE push_subscription
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    account_id BIGINT       NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với notification',
    endpoint   VARCHAR(500) NOT NULL,
    p256dh     VARCHAR(255) NOT NULL,
    auth_key   VARCHAR(255) NOT NULL COMMENT 'Tương ứng khóa "auth" của PushSubscriptionJSON',
    user_agent VARCHAR(255) NULL,
    last_ok_at DATETIME(6)  NULL COMMENT 'UTC; lần gửi thành công gần nhất, NULL nếu chưa từng',
    created_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_push_subscription_endpoint (endpoint),
    KEY idx_push_subscription_account (account_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Chống gửi trùng của DigestJob (IDEA §9 mục 4): mỗi (tài khoản, lần xảy ra, mốc nhắc) chỉ gộp vào bản tin một lần.
CREATE TABLE notification_dispatch
(
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    account_id      BIGINT       NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với notification',
    event_key       VARCHAR(150) NOT NULL COMMENT 'Khóa lần xảy ra, ví dụ MEMORIAL:12:2026-10-01',
    occurrence_date DATE         NOT NULL COMMENT 'Ngày dương của lần xảy ra',
    days_before     INT          NOT NULL COMMENT 'Mốc nhắc đã gửi: 30/7/3/1/0 ngày trước',
    created_at      DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_notification_dispatch (account_id, event_key, occurrence_date, days_before)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
