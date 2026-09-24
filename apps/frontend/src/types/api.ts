import type { components } from '@/services/schema'

/** Kiểu DTO lấy từ schema.d.ts (sinh tự động bằng `npm run gen:api`), không viết tay lại. */
export type Schemas = components['schemas']

export type Me = Schemas['MeResponse']
export type AuthResponse = Schemas['AuthResponse']
export type OtpSent = Schemas['OtpSentResponse']
