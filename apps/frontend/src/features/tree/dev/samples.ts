// Đồ thị mẫu cho trang /dev/cay. Tên "Ô n" là dữ liệu thử, không phải người thật (DECISIONS #71).
import type { TreeGraph, TreeNode } from '@/utils/tree'

type NodeInit = { parent?: number; co?: number; sort?: number; empty?: boolean; dead?: boolean }

function node(id: number, init: NodeInit = {}): TreeNode {
  const empty = init.empty === true
  return {
    id,
    memberId: empty ? null : id,
    member: empty
      ? null
      : {
          fullName: `Ô ${id}`,
          gender: null,
          avatarUrl: null,
          labels: [],
          birthYear: 1900 + id,
          isDeceased: init.dead === true,
          deathYear: init.dead === true ? 1970 + id : null,
        },
    parentNodeId: init.parent ?? null,
    coParentNodeId: init.co ?? null,
    sortOrder: init.sort ?? 0,
  }
}

const spouse = (nodeId: number, spouseNodeId: number, order: number) => ({ nodeId, spouseNodeId, order })

export type TreeSample = { id: string; title: string; description: string; graph: TreeGraph }

export const TREE_SAMPLES: [TreeSample, ...TreeSample[]] = [
  {
    id: 'multi-spouse',
    title: 'Nhiều vợ + ô trống',
    description:
      'Ô 1 có hai vợ/chồng (ô 3 là ô trống). Ô 5, 7 là con của cặp (1, 2); ô 6 là con của cặp (1, 3). Con phải đi xuống từ trung điểm của đúng cặp.',
    graph: {
      nodes: [
        node(1, { dead: true }),
        node(2, { dead: true }),
        node(3, { empty: true }),
        node(5, { parent: 1, co: 2, sort: 1 }),
        node(7, { parent: 1, co: 2, sort: 2 }),
        node(6, { parent: 1, co: 3, sort: 3 }),
        node(8),
        node(9, { parent: 5, co: 8, sort: 1 }),
        node(10, { parent: 6, sort: 1 }),
        node(11, { parent: 7, sort: 1 }),
      ],
      spouses: [spouse(1, 2, 1), spouse(1, 3, 2), spouse(5, 8, 1)],
    },
  },
  {
    id: 'two-roots',
    title: '2 gốc không nối',
    description: 'Ô 1 và ô 5 đều là gốc, không nối với nhau: hai cây đứng cạnh nhau, cùng ở Đời 01.',
    graph: {
      nodes: [
        node(1, { sort: 0 }),
        node(2),
        node(3, { parent: 1, co: 2, sort: 1 }),
        node(4, { parent: 1, co: 2, sort: 2 }),
        node(5, { sort: 1 }),
        node(6),
        node(7, { parent: 5, co: 6, sort: 1 }),
        node(8, { parent: 5, co: 6, sort: 2 }),
        node(9, { parent: 5, co: 6, sort: 3 }),
      ],
      spouses: [spouse(1, 2, 1), spouse(5, 6, 1)],
    },
  },
  {
    id: 'empty-branch',
    title: 'Ô trống có con cháu',
    description: 'Ô 2 là ô trống nhưng vẫn có vợ/chồng (ô 3), hai con (ô 4, 5) và cháu (ô 6).',
    graph: {
      nodes: [
        node(1),
        node(2, { parent: 1, sort: 1, empty: true }),
        node(3),
        node(4, { parent: 2, co: 3, sort: 1 }),
        node(5, { parent: 2, co: 3, sort: 2 }),
        node(6, { parent: 5, sort: 1 }),
        node(7, { parent: 1, sort: 2 }),
      ],
      spouses: [spouse(2, 3, 1)],
    },
  },
  {
    id: 'three-spouses',
    title: 'Ba vợ/chồng (đường hôn nhân đi vòng)',
    description:
      'Vợ/chồng thứ 1 bên trái, thứ 2 bên phải, thứ 3 lại bên trái nhưng xa hơn nên đường hôn nhân đi vòng dưới ô 2.',
    graph: {
      nodes: [
        node(1),
        node(2),
        node(3),
        node(4),
        node(5, { parent: 1, co: 2, sort: 1 }),
        node(7, { parent: 1, co: 4, sort: 2 }),
        node(6, { parent: 1, co: 3, sort: 3 }),
      ],
      spouses: [spouse(1, 2, 1), spouse(1, 3, 2), spouse(1, 4, 3)],
    },
  },
  {
    id: 'compaction',
    title: 'Cây rộng (nén cây con)',
    description:
      'Ô 3 không có con nên cây con của ô 2 và ô 4 không bị đẩy ra xa hơn cần thiết, cũng không chồng lên nhau.',
    graph: {
      nodes: [
        node(1),
        node(2, { parent: 1, sort: 1 }),
        node(3, { parent: 1, sort: 2 }),
        node(4, { parent: 1, sort: 3 }),
        node(5, { parent: 2, sort: 1 }),
        node(6, { parent: 2, sort: 2 }),
        node(7, { parent: 2, sort: 3 }),
        node(8, { parent: 4, sort: 1 }),
        node(9, { parent: 4, sort: 2 }),
        node(10, { parent: 8, sort: 1 }),
        node(11, { parent: 8, sort: 2 }),
        node(12, { parent: 6, sort: 1 }),
      ],
      spouses: [],
    },
  },
]
