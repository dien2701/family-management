-- Trung tâm thông báo trong app (IDEA §9) và tùy chọn của từng tài khoản (IDEA §9 mục 6, DECISIONS #65, #77, #80).
CREATE TABLE notification
(
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    account_id BIGINT        NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với created_by khác',
    type       VARCHAR(30)   NOT NULL,
    title      VARCHAR(200)  NOT NULL,
    body       VARCHAR(1000) NOT NULL,
    link       VARCHAR(300)  NULL,
    is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)   NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_notification_account (account_id, created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Tùy chọn thông báo mỗi tài khoản; tạo lười ở lần đọc đầu tiên (roadmap Đợt 34). remind_days_before và remind_hour
-- (mặc định 07h, IDEA §9 mục 4) chỉ dùng cho job gộp bản tin theo giờ (Đợt 35); notify_proposals còn gác các thông
-- báo tức thời về đề xuất (đề xuất mới, kết quả đề xuất).
CREATE TABLE notification_pref
(
    account_id         BIGINT      NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với created_by khác',
    notify_events      BOOLEAN     NOT NULL DEFAULT TRUE,
    notify_memorials   BOOLEAN     NOT NULL DEFAULT TRUE,
    notify_proposals   BOOLEAN     NOT NULL DEFAULT TRUE,
    remind_days_before JSON        NOT NULL COMMENT 'Mảng số ngày trước, ví dụ [7,3,1,0]',
    remind_hour        VARCHAR(5)  NOT NULL DEFAULT '07:00' COMMENT 'HH:mm, giờ Asia/Ho_Chi_Minh',
    created_at         DATETIME(6) NOT NULL COMMENT 'UTC',
    updated_at         DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (account_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
