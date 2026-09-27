-- Sự kiện chung (IDEA §6.5). Giỗ và sinh nhật không lưu ở đây: tự sinh từ hồ sơ thành viên (module event, Đợt 31).
-- `year = NULL` nghĩa là lặp hằng năm theo `calendar`; có `year` thì chỉ diễn ra một lần vào đúng ngày đó.
-- `leap` chỉ có nghĩa khi `calendar = LUNAR`.
CREATE TABLE custom_event
(
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    title       VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NULL,
    calendar    VARCHAR(5)   NOT NULL COMMENT 'SOLAR | LUNAR',
    day         INT          NOT NULL,
    month       INT          NOT NULL,
    year        INT          NULL COMMENT 'NULL = lặp hằng năm',
    leap        BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Chỉ có nghĩa khi calendar = LUNAR',
    created_by  BIGINT       NULL COMMENT 'user_account.id; không có FK, cùng quy ước với created_by khác',
    created_at  DATETIME(6)  NOT NULL COMMENT 'UTC',
    updated_at  DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
