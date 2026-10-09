package vn.giapha.report.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/** Dựng một bảng Excel một sheet: dòng tiêu đề đậm và đông cứng, ngày là ô date, cột tự căn độ rộng. */
final class ReportExcel {

    private static final int MAX_WIDTH_CHARS = 60;
    private static final int DATE_WIDTH_CHARS = 10;

    private ReportExcel() {
    }

    /** Ô {@link LocalDate} thành ô ngày, {@link Number} thành số, {@code null} để trống, còn lại thành chuỗi. */
    static byte[] build(String sheetName, List<String> headers, List<List<Object>> rows) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(sheetName);

            Font bold = wb.createFont();
            bold.setBold(true);
            CellStyle head = wb.createCellStyle();
            head.setFont(bold);
            head.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            head.setFillPattern(FillPatternType.SOLID);
            CellStyle date = wb.createCellStyle();
            date.setDataFormat(wb.getCreationHelper().createDataFormat().getFormat("dd/mm/yyyy"));
            date.setAlignment(HorizontalAlignment.LEFT);

            // Không dùng autoSizeColumn: cần font AWT, máy chủ không có sẽ lỗi. Tự đo theo số ký tự.
            int[] width = new int[headers.size()];
            Row headerRow = sheet.createRow(0);
            for (int c = 0; c < headers.size(); c++) {
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers.get(c));
                cell.setCellStyle(head);
                width[c] = headers.get(c).length();
            }

            int r = 1;
            for (List<Object> values : rows) {
                Row row = sheet.createRow(r++);
                for (int c = 0; c < values.size(); c++) {
                    Object v = values.get(c);
                    if (v == null) {
                        continue;
                    }
                    Cell cell = row.createCell(c);
                    if (v instanceof LocalDate d) {
                        cell.setCellValue(d);
                        cell.setCellStyle(date);
                        width[c] = Math.max(width[c], DATE_WIDTH_CHARS);
                    } else if (v instanceof Number n) {
                        cell.setCellValue(n.doubleValue());
                        width[c] = Math.max(width[c], String.valueOf(n).length());
                    } else {
                        String s = v.toString();
                        cell.setCellValue(s);
                        width[c] = Math.max(width[c], s.length());
                    }
                }
            }

            sheet.createFreezePane(0, 1);
            for (int c = 0; c < width.length; c++) {
                sheet.setColumnWidth(c, Math.min(width[c] + 2, MAX_WIDTH_CHARS) * 256);
            }
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
