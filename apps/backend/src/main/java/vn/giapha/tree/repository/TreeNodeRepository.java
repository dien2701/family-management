package vn.giapha.tree.repository;

import java.util.List;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import vn.giapha.tree.entity.TreeNode;

public interface TreeNodeRepository extends JpaRepository<TreeNode, Long> {

    /** Toàn bộ cây, xếp theo id, để đọc (một truy vấn). */
    @Query("select n from TreeNode n order by n.id")
    List<TreeNode> findAllOrdered();

    /**
     * Toàn bộ cây kèm khóa ghi ({@code SELECT ... FOR UPDATE}) theo thứ tự id. Mọi thao tác dựng cây khóa cả cây
     * (vài trăm dòng, chỉ Admin ghi) nên hai Admin thao tác cùng lúc bị xếp hàng, không làm hỏng cây (DECISIONS #61).
     * Cùng thứ tự khóa ở mọi nơi nên không sinh deadlock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from TreeNode n order by n.id")
    List<TreeNode> findAllForUpdate();

    boolean existsByMemberId(Long memberId);
}
