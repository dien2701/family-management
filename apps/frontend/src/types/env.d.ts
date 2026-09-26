interface ImportMetaEnv {
  /** `mock` bật lớp giả lập (chỉ có tác dụng ở dev server, không bao giờ vào bản build prod). */
  readonly VITE_API_MODE?: string
  /** Ở chế độ giả lập: `real` dùng đăng nhập của backend thật, không đặt thì đăng nhập giả lập (vào thẳng Admin). */
  readonly VITE_MOCK_AUTH?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
