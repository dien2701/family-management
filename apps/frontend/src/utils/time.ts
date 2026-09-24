/** Mốc thời gian (ms) sau `seconds` giây kể từ bây giờ; mặc định 60 giây theo quy tắc gửi lại OTP. */
export function deadlineIn(seconds: number | undefined = 60): number {
  return Date.now() + seconds * 1000
}
