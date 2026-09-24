-- Dòng họ, mã mời, đồng ý dữ liệu cá nhân (IDEA §4, §6.2; DECISIONS #22–24).
-- `created_by` không có FK: xóa tài khoản người tạo (đợt quản trị) không được chặn bởi dòng họ hay mã mời còn tồn tại.
CREATE TABLE family
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    origin_place VARCHAR(200) NULL,
    description  VARCHAR(2000) NULL,
    cover_url    VARCHAR(500) NULL,
    created_by   BIGINT       NOT NULL,
    created_at   DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- V2 đã để sẵn cột family_id; giờ bảng family có rồi nên thêm khóa ngoại.
ALTER TABLE user_account
    ADD CONSTRAINT fk_user_family FOREIGN KEY (family_id) REFERENCES family (id),
    ADD KEY idx_user_family (family_id);

-- Mã mời dùng nhiều lần cho tới khi hết hạn hoặc bị thu hồi. Mã không phải bí mật xác thực nên lưu thô để Manager xem lại.
CREATE TABLE family_invitation
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    family_id  BIGINT      NOT NULL,
    code       VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'chữ hoa + số, đã bỏ ký tự dễ nhầm',
    expires_at DATETIME(6) NOT NULL COMMENT 'UTC',
    revoked_at DATETIME(6) NULL COMMENT 'UTC; NULL = chưa thu hồi',
    created_by BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_invitation_code (code),
    KEY idx_invitation_family (family_id, created_at),
    CONSTRAINT fk_invitation_family FOREIGN KEY (family_id) REFERENCES family (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Mỗi lần tạo hoặc tham gia family lưu một bản ghi đồng ý theo NĐ 13/2023, kèm phiên bản chính sách.
CREATE TABLE user_consent
(
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    family_id      BIGINT      NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    accepted_at    DATETIME(6) NOT NULL COMMENT 'UTC',
    ip             VARCHAR(45) NULL,
    PRIMARY KEY (id),
    KEY idx_consent_user (user_id),
    KEY idx_consent_family (family_id),
    CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_consent_family FOREIGN KEY (family_id) REFERENCES family (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
