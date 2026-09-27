import { Network } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTree, useTreeModel } from '@/hooks/useTree'
import type { TreeNode } from '@/types/api'
import type { TreeIndex } from '@/utils/tree'
import { memberStrings } from '../strings'

const s = memberStrings.onTree

/** Một người trên cây: có hồ sơ thì là liên kết tới hồ sơ, ô trống thì chỉ ghi "Ô trống". */
function Person({ node, suffix }: { node: TreeNode; suffix?: string }) {
  return (
    <>
      {node.memberId !== null && node.member ? (
        <Link to={`/thanh-vien/${node.memberId}`} className="font-medium text-accent-text underline-offset-2 hover:underline">
          {node.member.fullName}
        </Link>
      ) : (
        <span className="text-text-muted">{s.emptySlot}</span>
      )}
      {suffix && <span className="text-text-muted"> ({suffix})</span>}
    </>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-text-muted sm:w-28">{label}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function List({ people }: { people: { node: TreeNode; suffix?: string }[] }) {
  if (people.length === 0) return <span className="text-text-muted">{s.none}</span>
  return (
    <ul className="flex flex-col gap-0.5">
      {people.map(({ node, suffix }) => (
        <li key={node.id}>
          <Person node={node} suffix={suffix} />
        </li>
      ))}
    </ul>
  )
}

/** Cha/mẹ, vợ/chồng và con của một ô, đúng như trên cây (không phải danh sách người thân trong hồ sơ). */
function relationsOf(index: TreeIndex, node: TreeNode) {
  const ownerId = index.ownerOf.get(node.id)
  const owner = ownerId === undefined ? undefined : index.nodes.get(ownerId)

  const parents = [node.parentNodeId, node.coParentNodeId]
    .map((id) => (id === null ? undefined : index.nodes.get(id)))
    .filter((n): n is TreeNode => n !== undefined)
    .map((n) => ({ node: n }))

  // Ô vợ/chồng: người kia là vợ/chồng; ô thuộc dòng: các vợ/chồng theo thứ tự
  const spouses = owner
    ? [{ node: owner, suffix: s.spouseOrder((index.spousesOf.get(owner.id) ?? []).find((sp) => sp.node.id === node.id)?.order ?? 1) }]
    : (index.spousesOf.get(node.id) ?? []).map((sp) => ({ node: sp.node, suffix: s.spouseOrder(sp.order) }))

  // Ô vợ/chồng: con của cặp này; ô thuộc dòng: mọi con của người đó
  const children = (index.childrenOf.get(owner ? owner.id : node.id) ?? [])
    .filter((c) => !owner || c.coParentNodeId === node.id)
    .map((n) => ({ node: n }))

  return { parents, spouses, children }
}

type TreeSectionProps = { memberId: number; isAdmin: boolean }

/** Khối **"Trên cây"** của hồ sơ: đời, cha/mẹ, vợ/chồng, con theo cây và nút "Xem trên cây" (IDEA §6.1). */
export function TreeSection({ memberId, isAdmin }: TreeSectionProps) {
  const tree = useTree()
  const model = useTreeModel(tree.data)
  const nodeId = model?.index.nodeOfMember.get(memberId)
  const node = nodeId === undefined ? undefined : model?.index.nodes.get(nodeId)

  return (
    <section
      aria-labelledby="member-tree-title"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <h2 id="member-tree-title" className="text-lg font-semibold">
        {memberStrings.detail.sections.tree}
      </h2>

      {tree.isLoading ? (
        <p role="status" className="text-text-muted">
          {s.loading}
        </p>
      ) : tree.isError || !model ? (
        <p role="alert" className="text-danger">
          {s.loadFailed}
        </p>
      ) : !node ? (
        <p className="text-text-muted">{isAdmin ? s.notOnTreeAdmin : s.notOnTree}</p>
      ) : (
        (() => {
          const { parents, spouses, children } = relationsOf(model.index, node)
          const generation = model.generations.get(node.id)
          return (
            <>
              <dl className="flex flex-col gap-2">
                {generation !== undefined && <Row label={s.generation}>{String(generation).padStart(2, '0')}</Row>}
                <Row label={s.parents}>
                  <List people={parents} />
                </Row>
                <Row label={s.spouses}>
                  <List people={spouses} />
                </Row>
                <Row label={s.children}>
                  <List people={children} />
                </Row>
              </dl>
              <div>
                <Button asChild variant="secondary">
                  <Link to={`/cay?o=${node.id}`}>
                    <Network aria-hidden="true" />
                    {s.viewOnTree}
                  </Link>
                </Button>
              </div>
            </>
          )
        })()
      )}
    </section>
  )
}
