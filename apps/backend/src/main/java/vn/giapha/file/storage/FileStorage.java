package vn.giapha.file.storage;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

import vn.giapha.file.entity.FileFormat;

/**
 * Kho lưu tệp (DECISIONS #67). Cloudinary nằm sau interface này để phần nghiệp vụ không dính SDK hay HTTP và có thể
 * thay bản giả khi cần.
 */
public interface FileStorage {

    /** Thông tin để giao diện tải thẳng lên kho: địa chỉ và các trường đã ký, gửi kèm trường {@code file}. */
    record SignedUpload(String uploadUrl, Map<String, String> fields) {
    }

    /** Tệp thật trên kho, đọc lại bằng khóa của máy chủ (không tin số liệu do giao diện gửi). */
    record StoredFile(String publicId, long bytes, String format, String secureUrl) {
    }

    SignedUpload signUpload(String publicId, FileFormat format);

    /** Rỗng khi kho không có tệp này. */
    Optional<StoredFile> inspect(String publicId, FileFormat format);

    /** Xóa tệp; lỗi kho được ghi log chứ không ném, vì thường chạy sau khi dữ liệu đã commit. */
    void delete(String publicId, FileFormat format);

    /** Link tải có chữ ký, hết hạn sau {@code ttl}; dùng cho tệp {@code authenticated}. */
    String downloadUrl(String publicId, FileFormat format, Duration ttl);
}
