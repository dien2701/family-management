package vn.giapha.tree.mapper;

import java.util.Map;

import org.springframework.stereotype.Component;

import vn.giapha.member.MemberFacade.MemberCard;
import vn.giapha.tree.dto.TreeMemberDto;
import vn.giapha.tree.dto.TreeNodeDto;
import vn.giapha.tree.dto.TreeSpouseDto;
import vn.giapha.tree.entity.TreeNode;
import vn.giapha.tree.entity.TreeSpouse;

/** Entity sang DTO của cây; thông tin thành viên lấy từ {@code MemberFacade} nên nhận vào dạng thẻ. */
@Component
public class TreeMapper {

    public TreeNodeDto toNode(TreeNode node, Map<Long, MemberCard> cards) {
        MemberCard card = node.getMemberId() == null ? null : cards.get(node.getMemberId());
        return new TreeNodeDto(node.getId(), card == null ? null : node.getMemberId(), card == null ? null : toMember(card),
                node.getParentNodeId(), node.getCoParentNodeId(), node.getSortOrder());
    }

    public TreeSpouseDto toSpouse(TreeSpouse spouse) {
        return new TreeSpouseDto(spouse.getNodeId(), spouse.getSpouseNodeId(), spouse.getOrder());
    }

    private static TreeMemberDto toMember(MemberCard c) {
        return new TreeMemberDto(c.fullName(), c.gender(), c.avatarUrl(), c.labels(), c.birthYear(), c.deceased(),
                c.deathYear());
    }
}
