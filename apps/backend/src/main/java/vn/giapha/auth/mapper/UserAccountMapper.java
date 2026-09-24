package vn.giapha.auth.mapper;

import org.mapstruct.Mapper;

import vn.giapha.auth.dto.MeResponse;
import vn.giapha.auth.entity.UserAccount;

@Mapper
public interface UserAccountMapper {

    MeResponse toMe(UserAccount user);
}
