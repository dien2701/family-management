package vn.giapha.report.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

/** Dựng PDF dạng "tiêu đề + các bảng", nhúng font Be Vietnam Pro (hỗ trợ tiếng Việt) và đánh số trang ở chân. */
final class ReportPdf {

    /**
     * Một bảng. {@code heading} khác {@code null} thì thành dòng tiêu đề nhóm ở đầu bảng và lặp lại khi bảng sang trang
     * mới (nên không bao giờ bị mồ côi cuối trang).
     */
    record Section(String heading, List<String> headers, float[] widths, List<List<String>> rows) {
    }

    private static final byte[] REGULAR = load("/fonts/BeVietnamPro-Regular.ttf");
    private static final byte[] BOLD = load("/fonts/BeVietnamPro-Bold.ttf");

    private static final Color HEADER_BG = new Color(0xE8, 0xE4, 0xDC);
    private static final Color GROUP_BG = new Color(0xF3, 0xEF, 0xE7);
    private static final Color BORDER = new Color(0xBD, 0xB6, 0xA8);

    private ReportPdf() {
    }

    static byte[] render(String title, String subtitle, Rectangle page, List<Section> sections, String emptyNote) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            BaseFont regular = font("BeVietnamPro-Regular.ttf", REGULAR);
            BaseFont bold = font("BeVietnamPro-Bold.ttf", BOLD);
            Font titleFont = new Font(bold, 16);
            Font subFont = new Font(regular, 9, Font.NORMAL, Color.DARK_GRAY);
            Font headFont = new Font(bold, 9);
            Font cellFont = new Font(regular, 9);

            Document doc = new Document(page, 36, 36, 40, 48);
            PdfWriter writer = PdfWriter.getInstance(doc, out);
            writer.setPageEvent(new PageNumbers(regular));
            doc.open();

            doc.add(new Paragraph(title, titleFont));
            Paragraph sub = new Paragraph(subtitle, subFont);
            sub.setSpacingAfter(10);
            doc.add(sub);

            if (sections.isEmpty()) {
                doc.add(new Paragraph(emptyNote, cellFont));
            }
            for (Section s : sections) {
                PdfPTable table = new PdfPTable(s.widths().length);
                table.setWidthPercentage(100);
                table.setWidths(s.widths());
                table.setSpacingAfter(10);
                int headerRows = 1;
                if (s.heading() != null) {
                    PdfPCell group = new PdfPCell(new Phrase(s.heading(), headFont));
                    group.setColspan(s.widths().length);
                    group.setBackgroundColor(GROUP_BG);
                    style(group);
                    table.addCell(group);
                    headerRows = 2;
                }
                for (String h : s.headers()) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, headFont));
                    cell.setBackgroundColor(HEADER_BG);
                    style(cell);
                    table.addCell(cell);
                }
                table.setHeaderRows(headerRows);
                for (List<String> row : s.rows()) {
                    for (String v : row) {
                        PdfPCell cell = new PdfPCell(new Phrase(v == null ? "" : v, cellFont));
                        style(cell);
                        table.addCell(cell);
                    }
                }
                doc.add(table);
            }
            doc.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Không dựng được PDF.", e);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void style(PdfPCell cell) {
        cell.setPadding(4);
        cell.setBorderColor(BORDER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
    }

    private static BaseFont font(String name, byte[] bytes) throws DocumentException, IOException {
        return BaseFont.createFont(name, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, bytes, null);
    }

    private static byte[] load(String path) {
        try (InputStream in = ReportPdf.class.getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalStateException("Thiếu font " + path);
            }
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Số trang ở giữa chân trang. */
    private static final class PageNumbers extends PdfPageEventHelper {

        private final BaseFont font;

        PageNumbers(BaseFont font) {
            this.font = font;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            cb.beginText();
            cb.setFontAndSize(font, 8);
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "Trang " + writer.getPageNumber(),
                    (document.left() + document.right()) / 2, document.bottom() - 24, 0);
            cb.endText();
        }
    }
}
