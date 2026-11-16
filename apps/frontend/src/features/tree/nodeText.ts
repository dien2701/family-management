import type { TreeMember, TreeNode } from '@/types/api'
import { treeStrings } from './strings'

/** Họ tên nguyên văn; ô trống thì "Ô trống". */
export const nodeName = (node: TreeNode) => node.member?.fullName ?? treeStrings.emptySlot

/** Còn sống: "1930" (chưa rõ thì rỗng). Đã mất: "1930 – 1990", phần chưa rõ ghi "_" (#101). */
export function yearsText(member: TreeMember): string {
  if (member.isDeceased) return `${member.birthYear ?? '_'} – ${member.deathYear ?? '_'}`
  return member.birthYear === null ? '' : String(member.birthYear)
}
