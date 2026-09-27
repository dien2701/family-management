package vn.giapha.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Chuẩn hóa để tìm không dấu (cột {@code search_name}): bỏ dấu, {@code đ} thành {@code d}, chữ thường, gộp khoảng trắng.
 * Giống hàm {@code toSearchName} của frontend và của script sinh seed ({@code shared/fixtures/seed/to-sql.mjs}).
 */
public final class SearchText {

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private SearchText() {
    }

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String plain = MARKS.matcher(Normalizer.normalize(text, Normalizer.Form.NFD)).replaceAll("")
                .replace('đ', 'd').replace('Đ', 'D');
        return SPACES.matcher(plain.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }
}
