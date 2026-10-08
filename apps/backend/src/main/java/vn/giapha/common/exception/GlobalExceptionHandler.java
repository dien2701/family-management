package vn.giapha.common.exception;

import java.util.List;

import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.ErrorResponse;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Mọi lỗi trả về dạng RFC 7807 {@link ProblemDetail}, thêm {@code code} và {@code errors[{field,message}]}.
 * Thông báo bằng tiếng Việt, không lộ chi tiết nội bộ.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<Object> handleBusiness(BusinessException ex, WebRequest request) {
        ProblemDetail body = problem(ex.getStatus(), ex.getCode(), ex.getMessage(), ex.getErrors());
        return handleExceptionInternal(ex, body, new HttpHeaders(), ex.getStatus(), request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
        List<FieldError> errors = ex.getConstraintViolations().stream()
                .map(v -> new FieldError(lastNode(v.getPropertyPath().toString()), v.getMessage()))
                .toList();
        ProblemDetail body = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
        return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.BAD_REQUEST, request);
    }

    /** Không để catch-all biến lỗi xác thực (vd. BadCredentialsException từ AuthenticationManager) thành 500. */
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<Object> handleAuthentication(AuthenticationException ex, WebRequest request) {
        ProblemDetail body = problem(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
                "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.", List.of());
        return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.UNAUTHORIZED, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        ProblemDetail body = problem(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Bạn không có quyền thực hiện thao tác này.", List.of());
        return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.FORBIDDEN, request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        log.error("Lỗi không lường trước", ex);
        ProblemDetail body = problem(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", List.of());
        return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, request);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<FieldError> errors = ex.getBindingResult().getAllErrors().stream()
                .map(e -> new FieldError(
                        e instanceof org.springframework.validation.FieldError fe ? fe.getField() : e.getObjectName(),
                        e.getDefaultMessage()))
                .toList();
        ProblemDetail body = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);
    }

    /** Validation trên tham số (@RequestParam, @PathVariable...) từ Spring 6.1 ném lỗi này thay vì ConstraintViolationException. */
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<FieldError> errors = ex.getParameterValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream()
                        .map(e -> new FieldError(String.valueOf(r.getMethodParameter().getParameterName()),
                                e.getDefaultMessage())))
                .toList();
        ProblemDetail body = problem(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        // Chỉ báo tên trường (không lộ thông điệp nội bộ của Jackson) để client biết trường nào thiếu hoặc sai kiểu
        List<FieldError> errors = ex.getCause() instanceof tools.jackson.databind.DatabindException de
                && !de.getPath().isEmpty() && de.getPath().getLast().getPropertyName() != null
                        ? List.of(new FieldError(de.getPath().getLast().getPropertyName(), "Thiếu hoặc sai kiểu dữ liệu."))
                        : List.of();
        ProblemDetail body = problem(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
                "Nội dung yêu cầu không đọc được.", errors);
        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);
    }

    /** Các lỗi MVC chuẩn (404, 405, 415, thiếu tham số...) đi qua đây để có cùng dạng và tiếng Việt. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        // Lỗi MVC chuẩn truyền body = null; lấy ProblemDetail của chính exception để chuẩn hóa
        if (body == null && ex instanceof ErrorResponse errorResponse) {
            body = errorResponse.getBody();
        }
        if (body instanceof ProblemDetail pd && (pd.getProperties() == null || !pd.getProperties().containsKey("code"))) {
            pd.setProperty("code", "HTTP_" + statusCode.value());
            pd.setProperty("errors", List.of());
            pd.setTitle(titleOf(statusCode));
            pd.setDetail(detailOf(statusCode));
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }

    private static ProblemDetail problem(HttpStatus status, String code, String message, List<FieldError> errors) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, message);
        pd.setTitle(titleOf(status));
        pd.setProperty("code", code);
        pd.setProperty("errors", errors);
        return pd;
    }

    private static String titleOf(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "Yêu cầu không hợp lệ";
            case 401 -> "Chưa đăng nhập";
            case 403 -> "Không có quyền";
            case 404 -> "Không tìm thấy";
            case 405 -> "Phương thức không được hỗ trợ";
            case 409 -> "Xung đột dữ liệu";
            case 415 -> "Định dạng không được hỗ trợ";
            case 429 -> "Quá nhiều yêu cầu";
            default -> status.is5xxServerError() ? "Lỗi hệ thống" : "Yêu cầu không hợp lệ";
        };
    }

    private static String detailOf(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "Không tìm thấy nội dung yêu cầu.";
            case 405 -> "Phương thức yêu cầu không được hỗ trợ.";
            case 415 -> "Định dạng dữ liệu không được hỗ trợ.";
            default -> status.is5xxServerError()
                    ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."
                    : "Yêu cầu không hợp lệ.";
        };
    }

    private static String lastNode(String path) {
        int i = path.lastIndexOf('.');
        return i < 0 ? path : path.substring(i + 1);
    }
}
