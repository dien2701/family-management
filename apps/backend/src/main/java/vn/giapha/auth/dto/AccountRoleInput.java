package vn.giapha.auth.dto;

import jakarta.validation.constraints.NotNull;

import vn.giapha.auth.entity.SystemRole;

/** Admin đổi vai trò của một tài khoản (DECISIONS #106). */
public record AccountRoleInput(@NotNull(message = "Vui lòng chọn vai trò.") SystemRole systemRole) {
}
