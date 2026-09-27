-- Thành viên gia phả (IDEA §4). Họ tên ghi nguyên văn; `search_name` do Service chuẩn hóa (bỏ dấu, đ thành d, chữ thường).
-- Ngày mất ghi cả dương và âm: có năm thì Service tự tính lịch còn lại; âm không năm thì chỉ có death_lunar_month/day.
-- `death_lunar_year` thêm so với IDEA §4 vì hợp đồng (MemberLunarDate.year) và dữ liệu ban đầu cần lưu năm âm.
-- `biography` dùng VARCHAR(5000) (đúng giới hạn của hợp đồng) thay cho TEXT để Hibernate `validate` khớp kiểu chuỗi.
CREATE TABLE member
(
    id                      BIGINT        NOT NULL AUTO_INCREMENT,
    full_name               VARCHAR(200)  NOT NULL,
    search_name             VARCHAR(200)  NOT NULL,
    taboo_name              VARCHAR(200)  NULL,
    gender                  VARCHAR(1)    NULL COMMENT 'M | F; được để trống',
    avatar_url              VARCHAR(500)  NULL,
    phone                   VARCHAR(30)   NULL,
    email                   VARCHAR(254)  NULL,
    biography               VARCHAR(5000) NULL,
    labels                  JSON          NULL COMMENT 'Mảng nhãn đặc biệt, ví dụ ["Liệt sỹ"]',
    birth_year              INT           NULL,
    birth_month             INT           NULL,
    birth_day               INT           NULL,
    birthday_calendar       VARCHAR(5)    NOT NULL DEFAULT 'SOLAR' COMMENT 'SOLAR | LUNAR: lịch tính sinh nhật hằng năm',
    birth_lunar_leap        BOOLEAN       NOT NULL DEFAULT FALSE,
    is_deceased             BOOLEAN       NOT NULL DEFAULT FALSE,
    death_year              INT           NULL COMMENT 'Ngày mất dương',
    death_month             INT           NULL,
    death_day               INT           NULL,
    death_lunar_year        INT           NULL COMMENT 'NULL khi chỉ biết ngày/tháng âm',
    death_lunar_month       INT           NULL,
    death_lunar_day         INT           NULL,
    death_lunar_leap        BOOLEAN       NOT NULL DEFAULT FALSE,
    memorial_override_day   INT           NULL COMMENT 'Ngày giỗ ghi đè (âm, không nhuận)',
    memorial_override_month INT           NULL,
    burial_place            VARCHAR(300)  NULL,
    created_by              BIGINT        NULL COMMENT 'user_account.id; NULL với dữ liệu ban đầu. Không có FK, cùng quy ước với các created_by khác',
    created_at              DATETIME(6)   NOT NULL COMMENT 'UTC',
    updated_at              DATETIME(6)   NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_member_search_name (search_name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- "Tôi là ai": mỗi tài khoản liên kết tối đa một thành viên và ngược lại. V2 chưa có bảng member nên cột này chưa thể
-- trỏ đi đâu; giá trị cũ (nếu có) là rác nên xóa trước khi thêm khóa ngoại. Xóa thành viên thì tài khoản vẫn còn,
-- chỉ bị gỡ liên kết (IDEA §6.1).
UPDATE user_account
SET member_id = NULL
WHERE member_id IS NOT NULL;

ALTER TABLE user_account
    ADD UNIQUE KEY uq_user_member (member_id),
    ADD CONSTRAINT fk_user_member FOREIGN KEY (member_id) REFERENCES member (id) ON DELETE SET NULL;
