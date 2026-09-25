package vn.giapha.common.web;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/** Trang kết quả dạng ổn định cho API (không lộ cấu trúc nội bộ của Spring Data). {@code page} đánh số từ 0. */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(),
                page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
