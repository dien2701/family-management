package vn.giapha.report.service;

/** Một tệp báo cáo đã dựng xong, kèm tên tệp có ngày xuất và loại nội dung. */
public record ReportFile(String filename, String contentType, byte[] bytes) {

    public static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String PDF = "application/pdf";
}
