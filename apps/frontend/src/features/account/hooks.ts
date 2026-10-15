import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ME_KEY } from '@/hooks/useMe'
import { useAuth } from '@/hooks/useAuth'
import { cropSquare } from '@/utils/image'
import { accountApi } from './api'

/** Ảnh đại diện nằm trong `/api/me`: nạp lại để header, menu và trang hồ sơ cùng cập nhật. */
function useRefreshMe() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuth()
  return async () => {
    const me = await accountApi.getMe()
    queryClient.setQueryData(ME_KEY, me)
    updateUser(me)
  }
}

/** Cắt vuông 512px ở trình duyệt rồi mới tải lên Cloudinary. */
export function useUploadMyAvatar() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: async (file: File) => accountApi.uploadAvatar(await cropSquare(file)),
    onSuccess: refreshMe,
  })
}

export function useRemoveMyAvatar() {
  const refreshMe = useRefreshMe()
  return useMutation({ mutationFn: accountApi.removeAvatar, onSuccess: refreshMe })
}
