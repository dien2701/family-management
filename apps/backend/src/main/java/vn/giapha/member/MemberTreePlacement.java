package vn.giapha.member;

import java.util.Map;

/**
 * Chỗ đứng của thành viên trên cây gia phả, để danh sách và hồ sơ thành viên trả {@code generation} và {@code onTree}.
 * Module cây hiện thực interface này (đảo phụ thuộc: {@code tree} gọi {@code member}, không có chiều ngược lại nên
 * hai module không vòng tròn).
 */
public interface MemberTreePlacement {

    /** Đời của từng thành viên đang có trên cây (gốc là đời 1); người chưa có trên cây không có trong map. */
    Map<Long, Integer> generations();
}
