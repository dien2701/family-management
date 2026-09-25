// TẠM THỜI: openapi.yaml v2 đã bỏ /api/family (Đợt 9) nhưng UI dòng họ còn tới Đợt 10 và backend còn tới Đợt 26,
// nên giữ tay các kiểu này (chép từ schema cũ) để build không vỡ. Đợt 10 gỡ cả features/family cùng file này.
export type FamilyAccountResponse = {
  id?: number
  fullName?: string
  avatarUrl?: string
  familyRole?: string
  memberId?: number
  email?: string
}

export type FamilyResponse = {
  id?: number
  name?: string
  originPlace?: string
  description?: string
  coverUrl?: string
  createdAt?: string
  accounts?: FamilyAccountResponse[]
}

export type CreateFamilyRequest = {
  name: string
  originPlace?: string
  description?: string
  acceptPolicy: boolean
}

export type JoinFamilyRequest = { code: string; acceptPolicy: boolean }

export type TransferManagerRequest = { userId: number }

export type InvitationResponse = {
  id?: number
  code?: string
  link?: string
  expiresAt?: string
  createdAt?: string
  revokedAt?: string
  status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
}
