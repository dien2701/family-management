package vn.giapha.auth.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.giapha.auth.entity.UserAccount;
import vn.giapha.auth.repository.UserAccountRepository;
import vn.giapha.common.exception.BusinessException;

/**
 * Luật liên kết tài khoản – thành viên (DECISIONS #80), dùng chung cho hai đường vào: Admin duyệt yêu cầu "Đây là tôi"
 * (qua {@code AuthFacade}) và Admin gán trực tiếp ({@code AdminAccountService}). Người gọi phải đã khóa dòng tài khoản
 * ({@code FOR UPDATE}) và chạy trong transaction.
 */
@Component
public class AccountLinking {

    private final UserAccountRepository users;

    AccountLinking(UserAccountRepository users) {
        this.users = users;
    }

    /** Chỉ tài khoản đã duyệt và đang hoạt động; quan hệ 1–1 nên cả hai phía đều phải còn trống. */
    public void link(UserAccount target, Long memberId) {
        if (!target.isActiveAndApproved()) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_ACCOUNT_STATE",
                    "Chỉ liên kết được thành viên cho tài khoản đã duyệt và đang hoạt động.");
        }
        if (target.getMemberId() != null) {
            throw new BusinessException(HttpStatus.CONFLICT, "ACCOUNT_ALREADY_LINKED",
                    "Tài khoản này đã liên kết với một thành viên. Hãy hủy liên kết cũ trước.");
        }
        if (users.existsByMemberId(memberId)) {
            throw memberAlreadyLinked();
        }
        target.linkMember(memberId);
        try {
            // Flush ngay để ràng buộc UNIQUE bắt được hai Admin cùng gán một thành viên cho hai tài khoản
            users.saveAndFlush(target);
        } catch (DataIntegrityViolationException e) {
            throw memberAlreadyLinked();
        }
    }

    public void unlink(UserAccount target) {
        if (target.getMemberId() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "NOT_LINKED",
                    "Tài khoản này chưa liên kết với thành viên nào.");
        }
        target.unlinkMember();
    }

    private static BusinessException memberAlreadyLinked() {
        return new BusinessException(HttpStatus.CONFLICT, "MEMBER_ALREADY_LINKED",
                "Thành viên này đã có tài khoản khác liên kết.");
    }
}
