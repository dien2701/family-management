package vn.giapha;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GiaPhaApplication {

    static {
        // JVM chạy UTC; chỉ đổi sang Asia/Ho_Chi_Minh ở tầng nghiệp vụ
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    public static void main(String[] args) {
        SpringApplication.run(GiaPhaApplication.class, args);
    }
}
