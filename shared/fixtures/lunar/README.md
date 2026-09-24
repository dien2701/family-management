# Bộ đối chiếu lịch âm (1900–2100)

Dữ liệu chung cho bản Java (`apps/backend`, `vn.giapha.calendar`) và bản TS (`apps/frontend/src/utils/lunar`, Đợt 7).
Hai bản **phải** cho cùng kết quả với mọi mục ở đây (DECISIONS #35).

## Nguồn (độc lập với code đang test)

- **Bảng tiền tính TK19–TK22 của Hồ Ngọc Đức** trong `amlich-hnd.js` (phiên bản 0.8, © 2004), bản lưu trữ:
  <https://web.archive.org/web/2020id_/http://www.informatik.uni-leipzig.de/~duc/amlich/JavaScript/amlich-hnd.js>
  (trang gốc `informatik.uni-leipzig.de/~duc/amlich/` đã không còn).
  SHA-256: `82de416dfa6de433a991b57784483388aee73904edc2a9e3c3f1f771e6b8fff2`.
  Bảng mã hóa sẵn từng năm âm 1800–2199: ngày Tết, độ dài 12 tháng, tháng nhuận và độ dài tháng nhuận.
  `generate.mjs` **chỉ giải mã bảng**, không chạy công thức thiên văn nào.
- **`samples.json`**: các mốc tra tay từ lịch đã công bố (Tết, tháng nhuận, Giỗ Tổ, Trung thu).
  `generate.mjs` dừng lại nếu có mốc nào không khớp bảng. Mốc Tết 2030 được đối chiếu thêm bằng PyEphem:
  sóc lúc 23:07 ngày 02/02 giờ +7, nên theo lịch Việt Nam Tết là 02/02, còn theo lịch Trung Quốc là 03/02.

## File

| File | Nội dung |
|---|---|
| `lunar-years.json` | Năm âm 1899–2100 (năm 1899 để phủ các ngày dương từ 01/01/1900). Mỗi năm có `tet`, `leapMonth` (0 = không nhuận) và `months[]` theo thứ tự `{month, leap, start (ngày dương mùng 1), days}` |
| `samples.json` | Mốc tra tay `{solar, lunar{year,month,day,leap}, note}` |
| `generate.mjs` | Sinh lại `lunar-years.json`: `node shared/fixtures/lunar/generate.mjs` (tải bản lưu trữ, kiểm tra SHA-256). Có thể truyền đường dẫn file `amlich-hnd.js` đã tải |

## Quy tắc rút ra khi đối chiếu (bản Java phải theo)

1. **Múi giờ**: bảng dùng **UTC+8 cho năm âm trước 1968** và UTC+7 từ năm 1968 (miền Bắc đổi sang lịch múi +7 từ Tết Mậu Thân 1968).
   Nếu dùng UTC+7 cho toàn bộ giai đoạn thì lệch 31 tháng, gồm Tết 1903, 1935, 1965 và tháng nhuận 1917, 1922, 1938, 1947.
   Năm đổi múi giờ: Tết 1968 là 29/01, nên tháng Chạp năm Đinh Mùi 1967 chỉ có 29 ngày.
2. **Hiệu chỉnh ngày sóc**: công thức rút gọn của Hồ Ngọc Đức (`amlich-aa98.js`) vẫn lệch bảng ở **8 tháng**.
   Ở các tháng này, trăng mới rơi cách nửa đêm vài phút (theo PyEphem):

   | Múi | Tháng âm | Công thức tính | Bảng |
   |---|---|---|---|
   | +8 | 4/1906 | 24/04/1906 | 23/04/1906 |
   | +8 | 10/1914 | 18/11/1914 | 17/11/1914 |
   | +8 | 1/1916 (Tết) | 04/02/1916 | 03/02/1916 |
   | +8 | 10/1920 | 11/11/1920 | 10/11/1920 |
   | +8 | 1/1925 (Tết) | 24/01/1925 | 25/01/1925 |
   | +7 | 4/2054 | 08/05/2054 | 07/05/2054 |
   | +7 | 11/2072 | 10/12/2072 | 09/12/2072 |
   | +7 | 10/2077 | 16/11/2077 | 15/11/2077 |

   Bản Java dùng ngày của bảng (`LunarCalendar.NEW_MOON_FIXES`). Riêng tháng 4/2054, công thức gốc còn trả ra "ngày 0" với 07/05/2054.
3. Ngoài khoảng 1900–2100 **chưa đối chiếu**. Bảng TK19 (1800–1899) còn lệch cả tháng nhuận ở các năm 1800–1811, nên backend từ chối các năm này.

## Cách dùng trong test

- Java: `LunarCalendarTest` đọc hai file JSON, so Tết, tháng nhuận, ngày đầu và độ dài từng tháng, rồi đổi hai chiều **mọi ngày** 01/01/1900–31/12/2100.
- TS (Đợt 7): đọc cùng hai file này, không chép số liệu sang chỗ khác.
