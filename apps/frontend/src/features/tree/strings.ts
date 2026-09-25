export const treeStrings = {
  dev: {
    title: 'Kiểm tra layout cây',
    intro: 'Trang chỉ có ở chế độ dev, vẽ thô kết quả của layoutTree từ các đồ thị mẫu viết sẵn.',
    samples: 'Ca mẫu',
    maxDepth: 'Số đời hiện',
    allDepth: 'Tất cả',
    depthOption: (n: number) => `${n} đời`,
    hint: 'Bấm vào một ô để chọn, rồi thu gọn nhánh hoặc xem cây từ ô đó.',
    selected: (id: number) => `Đang chọn ô ${id}`,
    collapse: 'Thu gọn nhánh',
    expand: 'Mở nhánh',
    viewFrom: 'Xem từ ô này',
    viewAll: 'Về toàn cây',
    generation: (n: number) => `Đời ${String(n).padStart(2, '0')}`,
    hidden: (n: number) => `+${n} con`,
    diagramLabel: 'Sơ đồ cây mẫu',
  },
}
