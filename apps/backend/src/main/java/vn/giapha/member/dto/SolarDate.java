package vn.giapha.member.dto;

/** Ngày dương đầy đủ. Kiểu boxed để thiếu trường thì báo lỗi rõ thay vì ngầm thành 0. */
public record SolarDate(Integer year, Integer month, Integer day) {
}
