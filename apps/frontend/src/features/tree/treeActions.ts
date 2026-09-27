import { createContext, useContext } from 'react'

export type QuickAddKind = 'child' | 'spouse' | 'parent'

/** Hành động mà các ô trên sơ đồ gọi ngược lên trang Cây (giữ dữ liệu của ô thuần, không chứa hàm). */
export type TreeActions = {
  /** Bấm vào thân ô: người thì mở menu, ô trống thì (Admin) mở hộp chọn người điền. */
  open: (nodeId: number) => void
  /** Nút "⋯" của ô trống (Admin) mở menu thao tác. */
  openMenu: (nodeId: number) => void
  quickAdd: (kind: QuickAddKind, nodeId: number) => void
  /** Bấm "+N con": mở nhánh đang ẩn. */
  expandHidden: (nodeId: number) => void
  /** Kéo góc ô xong: lưu cỡ riêng của ô (chỉ trên máy này). */
  resize: (nodeId: number, width: number, height: number) => void
}

const noop = () => {}

export const TreeActionsContext = createContext<TreeActions>({
  open: noop,
  openMenu: noop,
  quickAdd: noop,
  expandHidden: noop,
  resize: noop,
})

export const useTreeActions = () => useContext(TreeActionsContext)
