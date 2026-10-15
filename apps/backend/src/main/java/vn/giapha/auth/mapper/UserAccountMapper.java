package vn.giapha.auth.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vn.giapha.auth.dto.AccountAdminResponse;
import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.entity.UserAccount;

@Mapper
public interface UserAccountMapper {

    /** {@code consentRequired} suy ra từ bảng consent, {@code approvalRequired} từ cấu hình; cả hai không nằm trong entity. */
    @Mapping(target = "consentRequired", source = "consentRequired")
    @Mapping(target = "approvalRequired", source = "approvalRequired")
    MeResponse toMe(UserAccount user, boolean consentRequired, boolean approvalRequired);

    /** {@code member} cần tên từ module member nên {@code AdminAccountService} gắn sau bằng {@code withMember}. */
    @Mapping(target = "member", ignore = true)
    AccountAdminResponse toAdminView(UserAccount user);
}
