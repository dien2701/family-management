package vn.giapha.admin.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.exception.BusinessException;

/**
 * Người gọi phải là Admin đang hoạt động và đã duyệt, đọc từ DB (không chỉ tin claim của {@code @PreAuthorize}).
 */
@Component
class AdminGuard {

    private final AuthFacade auth;

    AdminGuard(AuthFacade auth) {
        this.auth = auth;
    }

    void require(Long actorId) {
        if (!auth.find(actorId).map(AuthFacade.Account::admin).orElse(false)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                    "Bạn không có quyền thực hiện thao tác này.");
        }
    }
}
