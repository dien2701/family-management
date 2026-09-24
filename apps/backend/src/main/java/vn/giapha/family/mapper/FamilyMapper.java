package vn.giapha.family.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import vn.giapha.family.dto.FamilyAccountResponse;
import vn.giapha.family.dto.FamilyResponse;
import vn.giapha.family.dto.InvitationResponse;
import vn.giapha.family.entity.Family;
import vn.giapha.family.entity.FamilyInvitation;

@Mapper
public interface FamilyMapper {

    FamilyResponse toResponse(Family family, List<FamilyAccountResponse> accounts);

    InvitationResponse toResponse(FamilyInvitation invitation, String link, InvitationResponse.Status status);
}
