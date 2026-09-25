interface ImportMetaEnv {
  /** `mock` bật lớp giả lập (chỉ có tác dụng ở dev server, không bao giờ vào bản build prod). */
  readonly VITE_API_MODE?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
