package vn.giapha.file.storage;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.config.AppProperties;
import vn.giapha.file.entity.FileFormat;

/**
 * Cloudinary qua HTTP thẳng (không thêm SDK): ký bằng SHA-1 theo quy tắc của Cloudinary, đọc tệp bằng Admin API,
 * xóa bằng {@code destroy}, link tải bằng {@code download} có {@code expires_at}. {@code publicId} luôn do máy chủ
 * sinh hoặc đã qua kiểm ở service (chỉ gồm chữ, số, {@code / _ . -}) nên ghép thẳng vào đường dẫn được.
 */
@Component
class CloudinaryFileStorage implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryFileStorage.class);
    private static final String API = "https://api.cloudinary.com/v1_1/";

    private final AppProperties.File config;
    private final RestClient http = RestClient.create();
    private final JsonMapper json;
    private final Clock clock;

    CloudinaryFileStorage(AppProperties props, JsonMapper json, Clock clock) {
        this.config = props.file();
        this.json = json;
        this.clock = clock;
    }

    @Override
    public SignedUpload signUpload(String publicId, FileFormat format) {
        requireConfigured();
        Map<String, String> params = new TreeMap<>();
        params.put("public_id", publicId);
        params.put("timestamp", String.valueOf(now()));
        params.put("type", format.deliveryType());

        Map<String, String> fields = new LinkedHashMap<>(params);
        fields.put("api_key", config.apiKey());
        fields.put("signature", sign(params));
        return new SignedUpload(base(format) + "/upload", fields);
    }

    @Override
    public Optional<StoredFile> inspect(String publicId, FileFormat format) {
        requireConfigured();
        String url = API + config.cloudName() + "/resources/" + format.resourceType() + "/" + format.deliveryType()
                + "/" + publicId;
        try {
            String body = http.get().uri(URI.create(url))
                    .headers(h -> h.setBasicAuth(config.apiKey(), config.apiSecret()))
                    .retrieve()
                    .onStatus(status -> status.value() == 404, (req, res) -> {
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw storageError(null);
                    })
                    .body(String.class);
            if (body == null || body.isBlank()) {
                return Optional.empty();
            }
            JsonNode node = json.readTree(body);
            if (!node.hasNonNull("bytes")) {
                return Optional.empty();
            }
            return Optional.of(new StoredFile(node.path("public_id").asString(publicId), node.path("bytes").asLong(),
                    node.path("format").asString(""), node.path("secure_url").asString("")));
        } catch (BusinessException e) {
            throw e;
        } catch (RuntimeException e) {
            throw storageError(e);
        }
    }

    @Override
    public void delete(String publicId, FileFormat format) {
        if (!configured()) {
            log.warn("Chưa cấu hình Cloudinary, bỏ qua xóa tệp {}", publicId);
            return;
        }
        try {
            Map<String, String> params = new TreeMap<>();
            params.put("invalidate", "true");
            params.put("public_id", publicId);
            params.put("timestamp", String.valueOf(now()));
            params.put("type", format.deliveryType());

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            params.forEach(form::add);
            form.add("api_key", config.apiKey());
            form.add("signature", sign(params));
            http.post().uri(URI.create(base(format) + "/destroy"))
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException e) {
            log.warn("Không xóa được tệp {} trên Cloudinary: {}", publicId, e.getMessage());
        }
    }

    @Override
    public String downloadUrl(String publicId, FileFormat format, Duration ttl) {
        requireConfigured();
        long timestamp = now();
        Map<String, String> params = new TreeMap<>();
        params.put("expires_at", String.valueOf(timestamp + ttl.toSeconds()));
        params.put("public_id", publicId);
        params.put("timestamp", String.valueOf(timestamp));
        params.put("type", format.deliveryType());

        Map<String, String> query = new LinkedHashMap<>(params);
        query.put("api_key", config.apiKey());
        query.put("signature", sign(params));
        return base(format) + "/download?" + query.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    // ---------- Nội bộ ----------

    private String base(FileFormat format) {
        return API + config.cloudName() + "/" + format.resourceType();
    }

    private long now() {
        return clock.instant().getEpochSecond();
    }

    /** Chữ ký Cloudinary: các tham số sắp theo tên, nối {@code k=v} bằng {@code &}, thêm secret rồi SHA-1. */
    private String sign(Map<String, String> sortedParams) {
        String toSign = sortedParams.entrySet().stream().map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&")) + config.apiSecret();
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1").digest(toSign.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private boolean configured() {
        return notBlank(config.cloudName()) && notBlank(config.apiKey()) && notBlank(config.apiSecret());
    }

    private void requireConfigured() {
        if (!configured()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "STORAGE_NOT_CONFIGURED",
                    "Kho lưu tệp chưa được cấu hình.");
        }
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static BusinessException storageError(Throwable cause) {
        if (cause != null) {
            log.warn("Lỗi khi gọi Cloudinary: {}", cause.getMessage());
        }
        return new BusinessException(HttpStatus.BAD_GATEWAY, "STORAGE_ERROR", "Không kết nối được kho lưu tệp.");
    }
}
