// Self-check nhỏ cho kinship.ts (ngoại lệ có chủ đích với DECISIONS #84, Đợt 51): vài cặp dựng tay.
import { describe, expect, it } from 'vitest'
import type { TreeMember, TreeNode } from '@/types/api'
import { buildTreeIndex, computeGenerations } from './graph'
import { kinshipBetween } from './kinship'

const member = (fullName: string, gender: 'M' | 'F' | null): TreeMember => ({
  fullName,
  gender,
  avatarUrl: null,
  labels: [],
  birthYear: null,
  isDeceased: false,
  deathYear: null,
})
const node = (id: number, gender: 'M' | 'F' | null, parent: number | null = null, coParent: number | null = null, sortOrder = 1): TreeNode => ({
  id,
  memberId: id,
  member: member(`Người ${id}`, gender),
  parentNodeId: parent,
  coParentNodeId: coParent,
  sortOrder,
})

// 1 Ông ⚭ 2 Bà → 3 Cha (thứ 1), 4 Chú (thứ 2), 5 Cô (thứ 3); 3 ⚭ 6 Mẹ → 9 (chưa rõ giới tính, thứ 0), 8 (thứ 1);
// 4 ⚭ 7 Thím → 10; 11 ở một cây rời
const graph = {
  nodes: [
    node(1, 'M'), node(2, 'F'), node(3, 'M', 1, 2, 1), node(4, 'M', 1, 2, 2), node(5, 'F', 1, 2, 3),
    node(6, 'F'), node(7, 'F'), node(8, 'M', 3, 6, 1), node(9, null, 3, 6, 0), node(10, 'M', 4, 7, 1), node(11, 'M'),
  ],
  spouses: [
    { nodeId: 1, spouseNodeId: 2, order: 1 },
    { nodeId: 3, spouseNodeId: 6, order: 1 },
    { nodeId: 4, spouseNodeId: 7, order: 1 },
  ],
}
const index = buildTreeIndex(graph)
const generations = computeGenerations(index)
const kin = (a: number, b: number) => kinshipBetween(index, generations, a, b)
const calls = (a: number, b: number) => {
  const k = kin(a, b)
  return k && [k.aCallsB, k.bCallsA]
}

describe('kinshipBetween', () => {
  it('vợ chồng, dòng thẳng và cha mẹ ruột là ô vợ/chồng', () => {
    expect(calls(1, 2)).toEqual(['Vợ', 'Chồng'])
    expect(calls(1, 8)).toEqual(['Cháu nội', 'Ông nội'])
    expect(calls(2, 8)).toEqual(['Cháu nội', 'Bà nội'])
    expect(calls(8, 6)).toEqual(['Mẹ', 'Con'])
    expect(kin(1, 8)?.path).toEqual([1, 3, 8])
  })

  it('anh em theo sortOrder, thiếu giới tính thì dạng gộp', () => {
    expect(calls(9, 8)).toEqual(['Em', 'Anh/Chị'])
    expect(kin(9, 8)?.needsGender).toBe(true)
    expect(kin(8, 10)?.needsGender).toBe(false)
    expect(calls(8, 10)).toEqual(['Em họ', 'Anh họ'])
  })

  it('lệch vai, qua hôn nhân và hai cây rời', () => {
    expect(calls(8, 4)).toEqual(['Chú', 'Cháu'])
    expect(calls(10, 3)).toEqual(['Bác', 'Cháu'])
    expect(calls(10, 5)).toEqual(['Cô', 'Cháu'])
    expect(calls(8, 7)).toEqual(['Thím', 'Cháu (bên chồng)'])
    expect(kin(1, 11)).toBeNull()
  })
})
