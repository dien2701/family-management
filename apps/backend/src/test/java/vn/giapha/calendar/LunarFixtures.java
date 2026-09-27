package vn.giapha.calendar;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Đọc bộ đối chiếu dùng chung {@code shared/fixtures/lunar} (sinh từ bảng của Hồ Ngọc Đức, không từ code Java). */
final class LunarFixtures {

    record Month(int month, boolean leap, LocalDate start, int days) {
    }

    record Year(int year, LocalDate tet, int leapMonth, List<Month> months) {
    }

    record Sample(LocalDate solar, LunarDate lunar, String note) {
    }

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private LunarFixtures() {
    }

    static List<Year> years() {
        List<Year> years = new ArrayList<>();
        for (JsonNode y : read("lunar-years.json").get("years")) {
            List<Month> months = new ArrayList<>();
            for (JsonNode m : y.get("months")) {
                months.add(new Month(m.get("month").asInt(), m.get("leap").asBoolean(),
                        LocalDate.parse(m.get("start").asString()), m.get("days").asInt()));
            }
            years.add(new Year(y.get("year").asInt(), LocalDate.parse(y.get("tet").asString()),
                    y.get("leapMonth").asInt(), List.copyOf(months)));
        }
        return years;
    }

    static List<Sample> samples() {
        List<Sample> samples = new ArrayList<>();
        for (JsonNode s : read("samples.json").get("samples")) {
            JsonNode l = s.get("lunar");
            samples.add(new Sample(LocalDate.parse(s.get("solar").asString()),
                    new LunarDate(l.get("year").asInt(), l.get("month").asInt(), l.get("day").asInt(),
                            l.get("leap").asBoolean()),
                    s.get("note").asString()));
        }
        return samples;
    }

    private static JsonNode read(String file) {
        try {
            return JSON.readTree(Files.readString(dir().resolve(file)));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Maven chạy test trong apps/backend; đi ngược lên tới gốc repo để tìm thư mục fixture. */
    private static Path dir() {
        for (Path p = Path.of("").toAbsolutePath(); p != null; p = p.getParent()) {
            Path candidate = p.resolve("shared/fixtures/lunar");
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Không tìm thấy shared/fixtures/lunar");
    }
}
