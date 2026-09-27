import { describe, expect, it } from 'vitest'
import { removeDiacritics, toSearchName } from './text'

describe('utils/text', () => {
  it('bỏ dấu tiếng Việt, đ thành d', () => {
    expect(removeDiacritics('Nguyễn Văn Đạt')).toBe('Nguyen Van Dat')
    expect(removeDiacritics('Cụ Kai Nhất')).toBe('Cu Kai Nhat')
  })

  it('toSearchName: chữ thường, gộp khoảng trắng, chịu được dấu ở dạng tổ hợp', () => {
    expect(toSearchName('  Cụ  Nguyễn   Văn Tham (Tức Cụ Kai) ')).toBe(
      'cu nguyen van tham (tuc cu kai)',
    )
    // "ễ" gõ bằng e + dấu mũ + dấu ngã rời
    expect(toSearchName('Nguyễn')).toBe('nguyen')
  })
})
