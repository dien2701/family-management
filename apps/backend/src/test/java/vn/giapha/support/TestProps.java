package vn.giapha.support;

import java.util.Map;

import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import vn.giapha.config.AppProperties;

/** Tạo {@link AppProperties} với giá trị mặc định (qua Binder, như khi chạy thật) cho unit test không dựng Spring. */
public final class TestProps {

    private TestProps() {
    }

    public static AppProperties defaults() {
        return with(Map.of());
    }

    public static AppProperties with(Map<String, Object> overrides) {
        return new Binder(new MapConfigurationPropertySource(overrides)).bindOrCreate("app", AppProperties.class);
    }
}
