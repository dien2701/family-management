package vn.giapha.ai.dto;

/** Một dòng khác biệt của bản nháp. {@code before} rỗng khi thêm mới, {@code after} rỗng khi xóa. */
public record AiDraftChange(String field, String label, String before, String after) {
}
