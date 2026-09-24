import { z } from 'zod'
import { familyStrings } from './strings'

const acceptPolicy = z.boolean().refine((v) => v, familyStrings.consent.required)

export const createFamilySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên dòng họ.')
    .max(100, 'Tên dòng họ tối đa 100 ký tự.'),
  // Không bắt buộc: chuỗi rỗng coi như không nhập
  originPlace: z.string().trim().max(200, 'Quê quán tối đa 200 ký tự.'),
  description: z.string().trim().max(2000, 'Mô tả tối đa 2000 ký tự.'),
  acceptPolicy,
})

export const joinFamilySchema = z.object({
  // Việc in hoa và bỏ khoảng trắng làm khi gửi (JoinFamilyForm)
  code: z.string().trim().min(1, 'Vui lòng nhập mã mời.').max(16, 'Mã mời không hợp lệ.'),
  acceptPolicy,
})

export type CreateFamilyValues = z.input<typeof createFamilySchema>
export type JoinFamilyValues = z.input<typeof joinFamilySchema>
