package vn.giapha;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModule;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {

    private static final List<String> EXPECTED_MODULES = List.of(
            "auth", "member", "tree", "calendar", "event", "proposal",
            "notification", "file", "ai", "report", "admin", "common");

    private final ApplicationModules modules = ApplicationModules.of(GiaPhaApplication.class);

    @Test
    void verifiesModuleStructure() {
        modules.verify();
    }

    @Test
    void detectsAllBusinessModules() {
        List<String> names = modules.stream().map(ApplicationModule::getIdentifier).map(Object::toString).toList();
        assertThat(names).containsAll(EXPECTED_MODULES);
    }
}
