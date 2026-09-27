-- Dữ liệu ban đầu: 28 thành viên (IDEA Phụ lục A, DECISIONS #68).
-- SINH TỰ ĐỘNG bằng shared/fixtures/seed/to-sql.mjs từ shared/fixtures/seed/members.json. KHÔNG SỬA TAY:
-- sửa members.json rồi chạy lại script (xem shared/fixtures/seed/README.md).
-- id gán theo thứ tự trong members.json (1..28); created_by để NULL vì đây là dữ liệu hệ thống.
INSERT INTO member (id, full_name, search_name, is_deceased,
                    death_year, death_month, death_day,
                    death_lunar_year, death_lunar_month, death_lunar_day, death_lunar_leap,
                    burial_place, created_at, updated_at)
VALUES
    (1, 'Cụ Nguyễn Văn Tham (Tức Cụ Kai)', 'cu nguyen van tham (tuc cu kai)', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (2, 'Cụ Kai Nhất', 'cu kai nhat', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (3, 'Cụ Phí Thị Giản (Tức Cụ Kai Nhị)', 'cu phi thi gian (tuc cu kai nhi)', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (4, 'Cụ Nguyễn Văn Sửu', 'cu nguyen van suu', TRUE, 1955, 8, 28, 1955, 7, 11, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (5, 'Cụ Nguyễn Thị Thêm', 'cu nguyen thi them', TRUE, NULL, NULL, NULL, NULL, 11, 1, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (6, 'Cụ Nguyễn Văn Tỵ', 'cu nguyen van ty', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (7, 'Cụ Nguyễn Văn Thân', 'cu nguyen van than', TRUE, 1980, 7, 29, 1980, 6, 18, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (8, 'Cụ Nguyễn Thị Dậu', 'cu nguyen thi dau', TRUE, 1986, 11, 22, 1986, 10, 21, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (9, 'Cụ Nguyễn Văn Uyên', 'cu nguyen van uyen', TRUE, 1986, 5, 29, 1986, 4, 21, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (10, 'Bà Trần Thị Nhung', 'ba tran thi nhung', TRUE, 2011, 2, 1, 2010, 12, 29, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (11, 'Ông Nguyễn Văn Tân', 'ong nguyen van tan', TRUE, 1999, 2, 18, 1999, 1, 3, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (12, 'Bà Nguyễn Thị Mít', 'ba nguyen thi mit', TRUE, 2016, 2, 9, 2016, 1, 2, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (13, 'Ông Nguyễn Văn Dương', 'ong nguyen van duong', TRUE, 1999, 4, 21, 1999, 3, 6, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (14, 'Bà Nguyễn Thị Khương', 'ba nguyen thi khuong', TRUE, 2015, 4, 1, 2015, 2, 13, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (15, 'Tổ cô Nguyễn Thị Bảy', 'to co nguyen thi bay', TRUE, 1946, 4, 14, 1946, 3, 13, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (16, 'Nguyễn Văn Thông', 'nguyen van thong', TRUE, 2005, 2, 7, 2004, 12, 29, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (17, 'Nguyễn Văn Dân', 'nguyen van dan', TRUE, 2020, 1, 10, 2019, 12, 16, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (18, 'Nguyễn Văn Kỷ', 'nguyen van ky', TRUE, 1987, 10, 4, 1987, 8, 12, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (19, 'Nguyễn Văn Toàn', 'nguyen van toan', TRUE, 2020, 6, 26, 2020, 5, 6, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (20, 'Nguyễn Văn Thành', 'nguyen van thanh', TRUE, 2025, 5, 28, 2025, 5, 2, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (21, 'Nguyễn Long', 'nguyen long', TRUE, 2019, 7, 3, 2019, 6, 1, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (22, 'Dương Thu Hương', 'duong thu huong', TRUE, 1994, 3, 13, 1994, 2, 2, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (23, 'Nguyễn Thị Hải', 'nguyen thi hai', TRUE, 1971, 9, 27, 1971, 8, 9, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (24, 'Nguyễn Mạnh Cường', 'nguyen manh cuong', TRUE, 2010, 11, 18, 2010, 10, 13, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (25, 'Nguyễn Quang Hưng', 'nguyen quang hung', TRUE, 2020, 8, 21, 2020, 7, 3, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (26, 'Nguyễn Thị Hằng', 'nguyen thi hang', TRUE, 1989, 9, 23, 1989, 8, 24, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (27, 'Cô bé đỏ', 'co be do', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
    (28, 'Cậu bé đỏ', 'cau be do', TRUE, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));
