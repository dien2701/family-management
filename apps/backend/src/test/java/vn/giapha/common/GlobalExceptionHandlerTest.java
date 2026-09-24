package vn.giapha.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.GlobalExceptionHandler;

@WebMvcTest(controllers = GlobalExceptionHandlerTest.ThrowingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandlerTest.ThrowingController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void businessExceptionKeepsStatusCodeAndMessage() throws Exception {
        mockMvc.perform(get("/test/business"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.code").value("MEMBER_NOT_FOUND"))
                .andExpect(jsonPath("$.detail").value("Không tìm thấy thành viên."))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void bodyValidationReturnsFieldErrors() throws Exception {
        mockMvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{\"fullName\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0].field").value("fullName"))
                .andExpect(jsonPath("$.errors[0].message").value("Họ tên không được để trống"));
    }

    @Test
    void parameterValidationReturnsFieldErrors() throws Exception {
        mockMvc.perform(get("/test/param").param("page", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0].field").value("page"))
                .andExpect(jsonPath("$.errors[0].message").value("Trang phải từ 1 trở lên"));
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mockMvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void unexpectedErrorDoesNotLeakInternals() throws Exception {
        mockMvc.perform(get("/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.detail").value("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret-internal"))));
    }

    @Test
    void authenticationExceptionReturns401Not500() throws Exception {
        mockMvc.perform(get("/test/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void unknownRouteReturnsVietnameseProblemDetail() throws Exception {
        mockMvc.perform(get("/test/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("HTTP_404"))
                .andExpect(jsonPath("$.detail").value("Không tìm thấy nội dung yêu cầu."))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void wrongMethodReturns405() throws Exception {
        mockMvc.perform(post("/test/business"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("HTTP_405"));
    }

    @RestController
    static class ThrowingController {

        record Body(@NotBlank(message = "Họ tên không được để trống") String fullName) {
        }

        @GetMapping("/test/business")
        String business() {
            throw new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên.");
        }

        @PostMapping("/test/body")
        String body(@Valid @RequestBody Body body) {
            return body.fullName();
        }

        @GetMapping("/test/param")
        String param(@RequestParam @Min(value = 1, message = "Trang phải từ 1 trở lên") int page) {
            return String.valueOf(page);
        }

        @GetMapping("/test/auth")
        String auth() {
            throw new BadCredentialsException("bad");
        }

        @GetMapping("/test/boom")
        String boom() {
            throw new IllegalStateException("secret-internal detail");
        }
    }
}
