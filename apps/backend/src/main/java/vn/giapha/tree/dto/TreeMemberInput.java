package vn.giapha.tree.dto;

/**
 * Thành viên chưa có trên cây. Không dùng annotation kiểm tra: {@code TreeService} trả {@code VALIDATION_ERROR} theo
 * từng trường, giống handler giả lập của frontend.
 */
public record TreeMemberInput(Long memberId) {
}
