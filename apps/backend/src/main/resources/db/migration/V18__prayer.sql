-- Bài khấn (DECISIONS #90): Admin soạn mẫu, ô trống viết {Tên ô} trong content.
CREATE TABLE prayer
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    title      VARCHAR(200) NOT NULL,
    content    TEXT         NOT NULL,
    created_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    updated_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Thông tin cá nhân tài khoản đã duyệt điền riêng từng bài; chỉ chính chủ đọc/ghi. Xóa tài khoản hoặc bài thì xóa theo.
CREATE TABLE prayer_fill
(
    account_id  BIGINT      NOT NULL,
    prayer_id   BIGINT      NOT NULL,
    values_json JSON        NOT NULL COMMENT 'Map tên ô -> giá trị',
    updated_at  DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (account_id, prayer_id),
    KEY idx_prayer_fill_prayer (prayer_id),
    CONSTRAINT fk_prayer_fill_account FOREIGN KEY (account_id) REFERENCES user_account (id) ON DELETE CASCADE,
    CONSTRAINT fk_prayer_fill_prayer FOREIGN KEY (prayer_id) REFERENCES prayer (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
