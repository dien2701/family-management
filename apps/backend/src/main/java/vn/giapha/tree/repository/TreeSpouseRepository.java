package vn.giapha.tree.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import vn.giapha.tree.entity.TreeSpouse;

public interface TreeSpouseRepository extends JpaRepository<TreeSpouse, Long> {

    @Query("select s from TreeSpouse s order by s.nodeId, s.spouseOrder, s.spouseNodeId")
    List<TreeSpouse> findAllOrdered();
}
