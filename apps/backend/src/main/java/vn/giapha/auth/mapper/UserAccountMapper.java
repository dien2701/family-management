package vn.giapha.auth.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import vn.giapha.auth.dto.AccountAdminResponse;
import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.entity.UserAccount;

@Mapper
public interface UserAccountMapper {

    /** {@code consentRequired} không nằm trong entity mà suy ra từ bảng consent nên truyền vào riêng. */
    @Mapping(target = "consentRequired", source = "consentRequired")
    MeResponse toMe(UserAccount user, boolean consentRequired);

    AccountAdminResponse toAdminView(UserAccount user);
}
