package vn.giapha.member.dto;

/** Sửa nhãn của một người thân. Nhãn bắt buộc, cắt khoảng trắng hai đầu, tối đa 50 ký tự (do service kiểm). */
public record RelativeLabelInput(String label) {
}
