package vn.giapha.file.entity;

import java.util.Locale;
import java.util.Optional;

/**
 * Định dạng cho phép (IDEA §6.7). Ảnh gửi lên Cloudinary loại {@code image} và công khai (giao diện dùng thẳng
 * {@code url}); PDF, docx, xlsx là {@code raw} ở chế độ {@code authenticated}, chỉ tải được bằng link ký hết hạn ngắn.
 */
public enum FileFormat {
    JPG("jpg", "image/jpeg", true),
    PNG("png", "image/png", true),
    WEBP("webp", "image/webp", true),
    PDF("pdf", "application/pdf", false),
    DOCX("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", false),
    XLSX("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", false);

    private final String extension;
    private final String mimeType;
    private final boolean image;

    FileFormat(String extension, String mimeType, boolean image) {
        this.extension = extension;
        this.mimeType = mimeType;
        this.image = image;
    }

    public String extension() {
        return extension;
    }

    public String mimeType() {
        return mimeType;
    }

    public boolean isImage() {
        return image;
    }

    /** Tham số {@code resource_type} của Cloudinary. */
    public String resourceType() {
        return image ? "image" : "raw";
    }

    /** Tham số {@code type} của Cloudinary: ảnh công khai, còn lại cần chữ ký. */
    public String deliveryType() {
        return image ? "upload" : "authenticated";
    }

    public static Optional<FileFormat> ofMime(String mime) {
        if (mime == null) {
            return Optional.empty();
        }
        String m = mime.trim().toLowerCase(Locale.ROOT);
        for (FileFormat f : values()) {
            if (f.mimeType.equals(m)) {
                return Optional.of(f);
            }
        }
        return Optional.empty();
    }

    /** Theo đuôi tên tệp; chấp nhận {@code jpeg} như {@code jpg}. */
    public static Optional<FileFormat> ofFileName(String fileName) {
        if (fileName == null) {
            return Optional.empty();
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return Optional.empty();
        }
        String ext = fileName.substring(dot + 1).trim().toLowerCase(Locale.ROOT);
        if (ext.equals("jpeg")) {
            ext = "jpg";
        }
        for (FileFormat f : values()) {
            if (f.extension.equals(ext)) {
                return Optional.of(f);
            }
        }
        return Optional.empty();
    }
}
