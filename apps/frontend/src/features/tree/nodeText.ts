import type { TreeMember, TreeNode } from '@/types/api'
import { treeStrings } from './strings'

/** Họ tên nguyên văn; ô trống thì "Ô trống". */
export const nodeName = (node: TreeNode) => node.member?.fullName ?? treeStrings.emptySlot

/** "1930", "1930 – ✝ 1990", "✝ 1990" (năm sinh hoặc năm mất chưa rõ thì bỏ hoặc ghi "?"). */
export function yearsText(member: TreeMember): string {
  if (member.isDeceased) {
    const death = `✝ ${member.deathYear ?? '?'}`
    return member.birthYear === null ? death : `${member.birthYear} – ${death}`
  }
  return member.birthYear === null ? '' : String(member.birthYear)
}

/** Năm sinh–mất tách dòng cho ô dọc: ["1930", "✝ 1990"], ["✝ 1990"] hoặc ["1930"]. */
export function yearsLines(member: TreeMember): string[] {
  const lines: string[] = []
  if (member.birthYear !== null) lines.push(String(member.birthYear))
  if (member.isDeceased) lines.push(`✝ ${member.deathYear ?? '?'}`)
  return lines
}
