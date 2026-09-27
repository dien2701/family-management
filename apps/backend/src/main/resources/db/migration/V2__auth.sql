-- Auth (IDEA §4, §6.1). Cột email dùng ascii_bin: collation mặc định utf8mb4_0900_ai_ci bỏ dấu (é = e) nên
-- 'alice@gmaíl.com' sẽ khớp tài khoản 'alice@gmail.com' còn OTP lại gửi tới địa chỉ do người gọi cung cấp. Các enum lưu dạng VARCHAR để Hibernate `validate` khớp.
-- `family_id` và `member_id` chưa có FK vì bảng family/member ra đời ở đợt sau; đợt đó thêm FK bằng file V mới.
CREATE TABLE user_account
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    email              VARCHAR(254) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'ASCII, đã chữ thường; so khớp chính xác, không bỏ dấu',
    password_hash      VARCHAR(100) NULL COMMENT 'BCrypt; NULL với tài khoản chỉ đăng nhập bằng Google',
    google_sub         VARCHAR(64)  NULL,
    full_name          VARCHAR(100) NOT NULL,
    avatar_url         VARCHAR(500) NULL,
    system_role        VARCHAR(10)  NOT NULL DEFAULT 'USER' COMMENT 'ADMIN | USER',
    status             VARCHAR(10)  NOT NULL COMMENT 'PENDING | ACTIVE | LOCKED',
    lock_reason        VARCHAR(20)  NULL COMMENT 'MANUAL | MEMBER_LOCKED',
    family_id          BIGINT       NULL,
    family_role        VARCHAR(10)  NULL COMMENT 'MANAGER | MEMBER; NULL khi chưa có family',
    member_id          BIGINT       NULL,
    hide_maternal_line BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_google_sub (google_sub),
    KEY idx_user_status_created (status, created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- OTP chỉ lưu hash (HMAC), kèm bộ đếm số lần thử.
CREATE TABLE email_otp
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(254) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    purpose    VARCHAR(10)  NOT NULL COMMENT 'REGISTER | RESET',
    code_hash  CHAR(64)     NOT NULL,
    expires_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    attempts   INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_otp_email_purpose (email, purpose),
    KEY idx_otp_expires (expires_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Refresh token chỉ lưu SHA-256 (hex) của chuỗi ngẫu nhiên trong cookie.
CREATE TABLE refresh_token
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash CHAR(64)    NOT NULL,
    expires_at DATETIME(6) NOT NULL COMMENT 'UTC',
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_token_hash (token_hash),
    KEY idx_refresh_user (user_id),
    KEY idx_refresh_expires (expires_at),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES user_account (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
