import { describe, expect, it } from 'vitest'
import { createFamilySchema, joinFamilySchema } from './schemas'

const valid = { name: 'Dòng họ Nguyễn', originPlace: '', description: '', acceptPolicy: true }

describe('createFamilySchema', () => {
  it('chỉ bắt buộc tên và đồng ý chính sách', () => {
    expect(createFamilySchema.safeParse(valid).success).toBe(true)
  })

  it('không tick đồng ý thì bị chặn ở đúng trường acceptPolicy', () => {
    const result = createFamilySchema.safeParse({ ...valid, acceptPolicy: false })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['acceptPolicy'])
  })

  it('tên trống hoặc chỉ khoảng trắng bị từ chối', () => {
    for (const name of ['', '   ']) {
      expect(createFamilySchema.safeParse({ ...valid, name }).success, name).toBe(false)
    }
  })

  it('giới hạn độ dài theo backend (100/200/2000)', () => {
    expect(createFamilySchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
    expect(createFamilySchema.safeParse({ ...valid, originPlace: 'a'.repeat(201) }).success).toBe(
      false,
    )
    expect(createFamilySchema.safeParse({ ...valid, description: 'a'.repeat(2001) }).success).toBe(
      false,
    )
  })
})

describe('joinFamilySchema', () => {
  it('cần mã mời và đồng ý chính sách', () => {
    expect(joinFamilySchema.safeParse({ code: 'ABCD2345', acceptPolicy: true }).success).toBe(true)
    expect(joinFamilySchema.safeParse({ code: '  ', acceptPolicy: true }).success).toBe(false)
    expect(joinFamilySchema.safeParse({ code: 'ABCD2345', acceptPolicy: false }).success).toBe(
      false,
    )
  })

  it('mã quá 16 ký tự là không hợp lệ', () => {
    expect(joinFamilySchema.safeParse({ code: 'A'.repeat(17), acceptPolicy: true }).success).toBe(
      false,
    )
  })
})
