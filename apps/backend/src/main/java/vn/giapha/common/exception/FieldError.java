package vn.giapha.common.exception;

/** Một lỗi gắn với trường cụ thể, trả trong {@code errors[]} của ProblemDetail. */
public record FieldError(String field, String message) {
}
