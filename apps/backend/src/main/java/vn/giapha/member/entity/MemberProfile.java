package vn.giapha.member.entity;

/**
 * Nội dung hồ sơ đã kiểm tra và chuẩn hóa, sẵn sàng ghi vào {@link Member}. Không gồm ảnh đại diện (đổi qua
 * upload) và các mốc thời gian.
 *
 * @param labelsJson mảng JSON các nhãn, {@code null} khi không có nhãn
 */
public record MemberProfile(
        String fullName,
        String searchName,
        String tabooName,
        Gender gender,
        String phone,
        String email,
        String biography,
        String labelsJson,
        Birth birth,
        Death death) {

    /** Ngày sinh; {@code year}, {@code month}, {@code day} cùng {@code null} khi chưa biết gì. */
    public record Birth(Integer year, Integer month, Integer day, BirthCalendar calendar, boolean leap) {

        public static final Birth NONE = new Birth(null, null, null, BirthCalendar.SOLAR, false);
    }

    /**
     * Nhóm "đã mất". Ngày mất dương và âm là hai cách ghi của cùng một ngày: có năm thì có cả hai; âm không năm
     * thì chỉ có {@code lunarMonth} và {@code lunarDay}.
     */
    public record Death(
            boolean deceased,
            Integer solarYear, Integer solarMonth, Integer solarDay,
            Integer lunarYear, Integer lunarMonth, Integer lunarDay, boolean lunarLeap,
            Integer memorialDay, Integer memorialMonth,
            String burialPlace) {

        public static final Death ALIVE = new Death(false, null, null, null, null, null, null, false, null, null, null);
    }
}
