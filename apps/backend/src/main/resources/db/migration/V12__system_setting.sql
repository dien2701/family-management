-- Cấu hình hệ thống Admin đổi được lúc chạy (IDEA §6.10; DECISIONS #55, #62), dạng key-value, đọc qua cache
-- Caffeine (module admin, Đợt 32). Giá trị mặc định khớp cấu hình tĩnh cũ (app.policy.version, app.file.*).
CREATE TABLE system_setting
(
    setting_key   VARCHAR(50)  NOT NULL,
    setting_value VARCHAR(200) NOT NULL,
    updated_by    BIGINT       NULL COMMENT 'user_account.id; không có FK, cùng quy ước với updated_by khác',
    updated_at    DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (setting_key)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO system_setting (setting_key, setting_value, updated_by, updated_at)
VALUES ('POLICY_VERSION', '1', NULL, UTC_TIMESTAMP(6)),
       ('AI_QUOTA_USER', '15', NULL, UTC_TIMESTAMP(6)),
       ('AI_QUOTA_ADMIN', '30', NULL, UTC_TIMESTAMP(6)),
       ('UPLOAD_MAX_MB', '10', NULL, UTC_TIMESTAMP(6)),
       ('TOTAL_QUOTA_MB', '1024', NULL, UTC_TIMESTAMP(6));
