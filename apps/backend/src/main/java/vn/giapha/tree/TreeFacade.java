package vn.giapha.tree;

import org.springframework.stereotype.Component;

import vn.giapha.tree.service.TreeService;

/** API công khai của module tree cho module khác (dashboard, Đợt 32). */
@Component
public class TreeFacade {

    /** Số người trên cây và đời sâu nhất; 0 khi cây rỗng. */
    public record Stats(int onTree, int maxGeneration) {
    }

    private final TreeService service;

    TreeFacade(TreeService service) {
        this.service = service;
    }

    public Stats stats() {
        TreeService.TreeStats s = service.stats();
        return new Stats(s.onTree(), s.maxGeneration());
    }
}
