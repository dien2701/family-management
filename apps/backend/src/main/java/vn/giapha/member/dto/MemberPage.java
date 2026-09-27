package vn.giapha.member.dto;

import java.util.List;

/** Một trang danh sách thành viên; {@code page} đánh số từ 0. */
public record MemberPage(List<MemberSummary> items, int page, int size, long totalElements, int totalPages) {
}
