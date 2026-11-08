package vn.giapha.auth.entity;

public enum LockReason {
    MANUAL, MEMBER_LOCKED,
    /** Admin xóa tài khoản (DECISIONS #97); khôi phục thì tự mở khóa. */
    DELETED
}
