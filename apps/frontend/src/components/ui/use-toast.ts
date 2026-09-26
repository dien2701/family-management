type ToastInput = { title: string; description?: string; variant?: 'default' | 'destructive' }

// Chưa có hệ thống toast trong DESIGN; tạm báo bằng hộp thoại của trình duyệt
export function toast({ title, description }: ToastInput) {
  window.alert(description ? `${title}\n${description}` : title)
}
