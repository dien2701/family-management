package vn.giapha.auth.google;

/** Xác minh Google ID token (DECISIONS #15). Test thay bằng bản giả. */
public interface GoogleIdTokenVerifier {

    /** Ném {@link vn.giapha.common.exception.BusinessException} 401 khi token sai chữ ký, sai aud/iss hoặc hết hạn. */
    GoogleIdentity verify(String idToken);
}
