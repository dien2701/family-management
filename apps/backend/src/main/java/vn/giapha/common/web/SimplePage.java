package vn.giapha.common.web;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * Trang kết quả rút gọn (chỉ {@code items} và {@code totalPages}), dùng cho các API đánh số trang từ 1
 * (proposals, notifications). Khác {@link PageResponse}: không lộ {@code page}/{@code size}/{@code totalElements}.
 */
public record SimplePage<T>(List<T> items, int totalPages) {

    public static <E, T> SimplePage<T> of(Page<E> page, Function<E, T> mapper) {
        return new SimplePage<>(page.getContent().stream().map(mapper).toList(), Math.max(page.getTotalPages(), 1));
    }
}
