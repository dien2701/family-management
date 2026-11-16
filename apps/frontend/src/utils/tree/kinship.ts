// Xưng hô giữa hai người trên cây (DECISIONS #100, Đợt 51). Hàm thuần, chỉ chạy ở máy người dùng: không có API
// và không có bản Java. Dựng trên chỉ mục cây sẵn có, không tự duyệt cây lại.
import { getAncestors, lineageIdOf } from './graph'
import type { TreeIndex, TreeNode } from './types'

export type Kinship = {
  /** A gọi B là… */
  aCallsB: string
  /** B gọi A là… */
  bCallsA: string
  /** Các ô trên đường quan hệ, từ A tới B (gồm cả hai đầu). */
  path: number[]
  /** Có người chưa điền giới tính nên phải dùng dạng gộp ("Anh/Chị"). */
  needsGender: boolean
}

const bySortOrder = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder || a.id - b.id

/**
 * Xưng hô hai chiều giữa hai ô, hoặc `null` khi hai người không nối được với nhau (hai cây rời, ô lỗi).
 * Thứ tự xét: cùng ô → vợ/chồng → cùng là vợ/chồng của một người → huyết thống qua tổ tiên chung gần nhất
 * (dòng thẳng, anh em, họ, lệch vai) → qua hôn nhân (gọi theo người thuộc dòng, ghi thêm "bên vợ/chồng").
 * Vai anh/em lấy theo `sortOrder` của nhánh dưới tổ tiên chung (con nhà bác là anh chị dù ít tuổi hơn).
 */
export function kinshipBetween(
  index: TreeIndex,
  generations: ReadonlyMap<number, number>,
  aNodeId: number,
  bNodeId: number,
): Kinship | null {
  if (!generations.has(aNodeId) || !generations.has(bNodeId)) return null
  let needsGender = false
  const genderOf = (id: number | undefined) => (id === undefined ? null : (index.nodes.get(id)?.member?.gender ?? null))
  const by = (id: number, male: string, female: string, either = `${male}/${female}`) => {
    const g = genderOf(id)
    if (g === 'M') return male
    if (g === 'F') return female
    needsGender = true
    return either
  }
  const done = (aCallsB: string, bCallsA: string, path: number[]): Kinship => ({ aCallsB, bCallsA, path, needsGender })

  if (aNodeId === bNodeId) return done('Chính mình', 'Chính mình', [aNodeId])

  const a0 = lineageIdOf(index, aNodeId)
  const b0 = lineageIdOf(index, bNodeId)
  if (a0 === bNodeId || b0 === aNodeId) return done(by(bNodeId, 'Chồng', 'Vợ'), by(aNodeId, 'Chồng', 'Vợ'), [aNodeId, bNodeId])

  if (a0 === b0) {
    // Cùng là vợ/chồng của một người: người cưới trước là chị/anh
    const spouses = (index.spousesOf.get(a0) ?? []).map((s) => s.node.id)
    const aFirst = spouses.indexOf(aNodeId) < spouses.indexOf(bNodeId)
    return done(
      aFirst ? 'Em' : by(bNodeId, 'Anh', 'Chị'),
      aFirst ? by(aNodeId, 'Anh', 'Chị') : 'Em',
      [aNodeId, a0, bNodeId],
    )
  }

  const chainA = [a0, ...getAncestors(index, a0).map((n) => n.id)]
  const chainB = [b0, ...getAncestors(index, b0).map((n) => n.id)]
  const posInB = new Map(chainB.map((id, i) => [id, i]))
  const da = chainA.findIndex((id) => posInB.has(id))
  if (da < 0) return null
  const db = posInB.get(chainA[da] as number) as number

  const path = [...chainA.slice(0, da + 1), ...chainB.slice(0, db).reverse()]
  if (aNodeId !== a0) path.unshift(aNodeId)
  if (bNodeId !== b0) path.push(bNodeId)

  const node = (id: number | undefined) => index.nodes.get(id as number) as TreeNode
  /** Nội/ngoại theo giới tính cha/mẹ thuộc dòng của người ở đầu chuỗi. */
  const side = (chain: number[]) => {
    const g = genderOf(chain[1])
    return g === 'M' ? ' nội' : g === 'F' ? ' ngoại' : ''
  }
  const ancestorTerm = (d: number, id: number, sideText: string) =>
    d === 1 ? by(id, 'Cha', 'Mẹ') : d === 2 ? by(id, 'Ông', 'Bà') + sideText : d === 3 ? 'Cụ' : d === 4 ? 'Kỵ' : `Tổ tiên đời thứ ${d}`
  const descTerm = (d: number, sideText: string) =>
    d === 1 ? 'Con' : d === 2 ? `Cháu${sideText}` : d === 3 ? 'Chắt' : d === 4 ? 'Chút' : `Hậu duệ đời thứ ${d}`

  /** Ô vợ/chồng mà thật ra là cha/mẹ ruột trên đường đi (là `coParentNodeId` của ô ngay dưới người kia). */
  const bloodSpouse = (spouse: number, selfDepth: number, other: number[], otherDepth: number) =>
    selfDepth === 0 && otherDepth > 0 && node(other[otherDepth - 1]).coParentNodeId === spouse

  /**
   * Người thuộc dòng đầu chuỗi `s` gọi `addr` là gì; `addr` là người đầu chuỗi `t`, hoặc vợ/chồng của người đó
   * khi `inLaw` (gọi theo vai của người thuộc dòng, đổi sang dâu/rể, thím/mợ…).
   */
  const call = (s: number[], ds: number, t: number[], dt: number, addr: number, inLaw: boolean): string => {
    if (ds === 0) {
      if (!inLaw) return descTerm(dt, side(t))
      return dt === 1 ? by(addr, 'Con rể', 'Con dâu') : dt === 2 ? by(addr, 'Cháu rể', 'Cháu dâu') : descTerm(dt, '')
    }
    if (dt === 0) {
      if (inLaw && ds === 1) return by(addr, 'Cha dượng', 'Mẹ kế')
      return ancestorTerm(ds, addr, side(s))
    }
    const sOlder = bySortOrder(node(s[ds - 1]), node(t[dt - 1])) < 0
    if (ds === dt) {
      const cousin = ds > 1 ? ' họ' : ''
      if (inLaw) return sOlder ? by(addr, 'Em rể', 'Em dâu') : by(addr, 'Anh rể', 'Chị dâu')
      return (sOlder ? 'Em' : by(addr, 'Anh', 'Chị')) + cousin
    }
    if (ds < dt) {
      // Người kia thấp vai hơn
      const diff = dt - ds
      if (inLaw && diff <= 2) return by(addr, 'Cháu rể', 'Cháu dâu')
      return diff === 1 ? 'Cháu' : descTerm(diff, '')
    }
    // Người kia cao vai hơn: một đời là bác/chú/cô (nội) hoặc cậu/dì (ngoại), từ hai đời trở lên là ông/bà, cụ…
    const diff = ds - dt
    if (diff > 1) return ancestorTerm(diff, addr, '')
    const parentGender = genderOf(s[1])
    if (parentGender === null) needsGender = true
    const cousin = dt > 1 ? ' họ' : ''
    if (inLaw) {
      if (!sOlder) return 'Bác'
      if (parentGender === 'M') return by(addr, 'Chú', 'Thím')
      if (parentGender === 'F') return by(addr, 'Dượng', 'Mợ')
      return by(addr, 'Chú/Dượng', 'Thím/Mợ')
    }
    if (!sOlder) return `Bác${cousin}`
    if (parentGender === 'M') return by(addr, 'Chú', 'Cô') + cousin
    if (parentGender === 'F') return by(addr, 'Cậu', 'Dì') + cousin
    return by(addr, 'Chú/Cậu', 'Cô/Dì', 'Chú/Cô') + cousin
  }

  // Người là vợ/chồng (không phải cha/mẹ ruột trên đường đi) xưng theo người thuộc dòng, ghi thêm bên nào
  const aInLaw = aNodeId !== a0 && !bloodSpouse(aNodeId, da, chainB, db)
  const bInLaw = bNodeId !== b0 && !bloodSpouse(bNodeId, db, chainA, da)
  const sideOf = (lineage: number) => {
    const g = genderOf(lineage)
    if (g === null) needsGender = true
    return g === 'M' ? ' (bên chồng)' : g === 'F' ? ' (bên vợ)' : ' (bên vợ/chồng)'
  }

  const aCallsB = call(chainA, da, chainB, db, bNodeId, bInLaw) + (aInLaw ? sideOf(a0) : '')
  const bCallsA = call(chainB, db, chainA, da, aNodeId, aInLaw) + (bInLaw ? sideOf(b0) : '')
  return done(aCallsB, bCallsA, path)
}
