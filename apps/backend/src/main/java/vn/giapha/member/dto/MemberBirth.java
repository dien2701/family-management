package vn.giapha.member.dto;

import vn.giapha.member.entity.BirthCalendar;

/**
 * Ngày sinh; được phép chỉ có năm. {@code calendar} là lịch dùng để tính sinh nhật hằng năm (mặc định dương),
 * {@code leap} chỉ có nghĩa khi {@code calendar = LUNAR}.
 */
public record MemberBirth(Integer year, Integer month, Integer day, BirthCalendar calendar, Boolean leap) {
}
