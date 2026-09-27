package vn.giapha.auth.dto;

import vn.giapha.auth.entity.AccountStatus;
import vn.giapha.auth.entity.ApprovalStatus;
import vn.giapha.auth.entity.SystemRole;

/** Bộ lọc danh sách tài khoản của Admin; trường null nghĩa là không lọc. */
public record AccountFilter(ApprovalStatus approval, AccountStatus status, SystemRole role, String q) {
}
