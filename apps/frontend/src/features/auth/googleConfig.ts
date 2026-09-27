export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

/** Chưa cấu hình `VITE_GOOGLE_CLIENT_ID` thì ẩn nút Google và dòng "hoặc". */
export const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID)
