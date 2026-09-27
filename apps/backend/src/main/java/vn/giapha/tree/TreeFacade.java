package vn.giapha.tree;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import vn.giapha.member.MemberFacade;
import vn.giapha.member.MemberFacade.MemberRef;
import vn.giapha.tree.service.TreeService;

/** API công khai của module tree cho module khác (dashboard, AI, Đợt 32, Đợt 36). */
@Component
public class TreeFacade {

    /** Số người trên cây và đời sâu nhất; 0 khi cây rỗng. */
    public record Stats(int onTree, int maxGeneration) {
    }

    /** Cha/mẹ, vợ/chồng và con theo cây (tool {@code getRelatives}, IDEA §10). */
    public record FamilyMembers(List<MemberRef> parents, List<MemberRef> spouses, List<MemberRef> children) {
    }

    /** Tổ tiên (gần tới xa) và con cháu (mọi đời) theo cây (tool {@code getTreePath}, IDEA §10). */
    public record TreePath(List<MemberRef> ancestors, List<MemberRef> descendants) {
    }

    private final TreeService service;
    private final MemberFacade members;

    TreeFacade(TreeService service, MemberFacade members) {
        this.service = service;
        this.members = members;
    }

    public Stats stats() {
        TreeService.TreeStats s = service.stats();
        return new Stats(s.onTree(), s.maxGeneration());
    }

    /** {@code Optional.empty()} khi thành viên chưa có trên cây. */
    public Optional<FamilyMembers> getFamilyOf(Long memberId) {
        return service.familyMemberIdsOf(memberId)
                .map(ids -> new FamilyMembers(refsOf(ids.parents()), refsOf(ids.spouses()), refsOf(ids.children())));
    }

    /** {@code Optional.empty()} khi thành viên chưa có trên cây. */
    public Optional<TreePath> getTreePath(Long memberId) {
        return service.lineageMemberIdsOf(memberId)
                .map(ids -> new TreePath(refsOf(ids.ancestors()), refsOf(ids.descendants())));
    }

    private List<MemberRef> refsOf(List<Long> memberIds) {
        return members.findAll(memberIds);
    }
}
