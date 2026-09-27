-- Tệp đính kèm trên Cloudinary (IDEA §6.7; DECISIONS #62, #67, #78).
--
-- `member_id` NULL nghĩa là tài liệu chung. Không có khóa ngoại tới `member`: khi xóa thành viên, listener
-- MemberDeletedEvent xóa các dòng này (cùng transaction) rồi xóa tệp trên Cloudinary sau khi commit.
-- `public_id` là khóa nhận diện tệp trên Cloudinary (đã gồm folder `giapha/`), duy nhất để một tệp không bị ghi nhận hai lần.
CREATE TABLE attachment
(
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    kind          VARCHAR(20)  NOT NULL COMMENT 'AVATAR | DOCUMENT',
    member_id     BIGINT       NULL COMMENT 'NULL = tài liệu chung',
    public_id     VARCHAR(300) NOT NULL COMMENT 'Cloudinary public_id, gồm cả folder',
    format        VARCHAR(10)  NOT NULL COMMENT 'JPG | PNG | WEBP | PDF | DOCX | XLSX; loại tài nguyên và mime suy ra từ đây',
    url           VARCHAR(500) NOT NULL COMMENT 'secure_url Cloudinary; chỉ dùng được trực tiếp với tệp upload (ảnh)',
    title         VARCHAR(255) NULL,
    file_name     VARCHAR(255) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    created_by    BIGINT       NULL COMMENT 'user_account.id; không có FK, cùng quy ước với các created_by khác',
    created_at    DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_attachment_public_id (public_id),
    KEY idx_attachment_member (member_id, kind),
    CONSTRAINT chk_attachment_kind CHECK (kind IN ('AVATAR', 'DOCUMENT')),
    CONSTRAINT chk_attachment_avatar_member CHECK (kind <> 'AVATAR' OR member_id IS NOT NULL),
    CONSTRAINT chk_attachment_size CHECK (size_bytes > 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
