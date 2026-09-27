package vn.giapha.member.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Nội dung hồ sơ khi thêm hoặc sửa (PUT thay toàn bộ, trường bỏ trống nghĩa là xóa giá trị). Họ tên ghi nguyên văn.
 * Không có {@code avatarUrl}: ảnh đại diện đổi qua {@code /api/files/confirm}. Các quy tắc còn lại (ngày sinh, ngày
 * mất, nhãn, email) do {@code MemberInputParser} kiểm tra.
 *
 * <p>Ngày mất gửi <b>một trong hai</b> ({@code deathSolar} hoặc {@code deathLunar}); có cả hai thì dùng
 * {@code deathSolar}. Các trường về việc đã mất chỉ hợp lệ khi {@code isDeceased = true}.
 */
public record MemberInput(
        @NotBlank(message = "Vui lòng nhập họ tên.")
        @Size(max = 200, message = "Họ tên tối đa 200 ký tự.")
        String fullName,
        String gender,
        @Size(max = 200, message = "Tên húy tối đa 200 ký tự.") String tabooName,
        List<String> labels,
        @Size(max = 5000, message = "Tiểu sử tối đa 5000 ký tự.") String biography,
        @Size(max = 30, message = "Số điện thoại tối đa 30 ký tự.") String phone,
        @Size(max = 254, message = "Email tối đa 254 ký tự.") String email,
        @Valid MemberBirth birth,
        @JsonProperty("isDeceased") boolean isDeceased,
        SolarDate deathSolar,
        MemberLunarDate deathLunar,
        MemorialOverride memorialOverride,
        @Size(max = 300, message = "Nơi an táng tối đa 300 ký tự.") String burialPlace) {
}
