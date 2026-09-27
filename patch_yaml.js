const fs = require('fs')

const content = fs.readFileSync('shared/api/openapi.yaml', 'utf8')

const pathsToAdd = `
  /api/proposals:
    post:
      tags:
        - proposals
      summary: Đề xuất thêm/sửa/xóa sự kiện chung
      operationId: createProposal
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProposalInput'
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Proposal'
    get:
      tags:
        - proposals
      summary: (Admin) Danh sách đề xuất chờ duyệt (hoặc tất cả)
      operationId: getProposals
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: size
          in: query
          schema:
            type: integer
            default: 10
        - name: status
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProposalPage'
  /api/proposals/mine:
    get:
      tags:
        - proposals
      summary: Danh sách đề xuất của tôi
      operationId: getMyProposals
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: size
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProposalPage'
  /api/proposals/count:
    get:
      tags:
        - proposals
      summary: Đếm số lượng đề xuất đang chờ
      operationId: countPendingProposals
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                type: integer
  /api/proposals/{id}/approve:
    post:
      tags:
        - proposals
      summary: Duyệt đề xuất
      operationId: approveProposal
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApproveProposalRequest'
      responses:
        '200':
          description: Thành công
  /api/proposals/{id}/reject:
    post:
      tags:
        - proposals
      summary: Từ chối đề xuất
      operationId: rejectProposal
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RejectProposalRequest'
      responses:
        '200':
          description: Thành công
  /api/notifications:
    get:
      tags:
        - notifications
      summary: Danh sách thông báo
      operationId: getNotifications
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: size
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationPage'
  /api/notifications/unread-count:
    get:
      tags:
        - notifications
      summary: Số thông báo chưa đọc
      operationId: getUnreadCount
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                type: integer
  /api/notifications/{id}/read:
    post:
      tags:
        - notifications
      summary: Đánh dấu đã đọc
      operationId: readNotification
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Thành công
  /api/notifications/read-all:
    post:
      tags:
        - notifications
      summary: Đánh dấu tất cả đã đọc
      operationId: readAllNotifications
      responses:
        '200':
          description: Thành công
  /api/notifications/preferences:
    get:
      tags:
        - notifications
      summary: Lấy cài đặt thông báo
      operationId: getNotificationPreferences
      responses:
        '200':
          description: Thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationPref'
    put:
      tags:
        - notifications
      summary: Cập nhật cài đặt thông báo
      operationId: updateNotificationPreferences
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/NotificationPref'
      responses:
        '200':
          description: Thành công
  /api/push/public-key:
    get:
      tags:
        - push
      summary: Lấy VAPID public key
      operationId: getPushPublicKey
      responses:
        '200':
          description: Thành công
          content:
            text/plain:
              schema:
                type: string
  /api/push/subscribe:
    post:
      tags:
        - push
      summary: Đăng ký thiết bị nhận thông báo push
      operationId: subscribePush
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PushSubscription'
      responses:
        '200':
          description: Thành công
    delete:
      tags:
        - push
      summary: Hủy đăng ký push trên thiết bị
      operationId: unsubscribePush
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UnsubscribePushRequest'
      responses:
        '200':
          description: Thành công
  /api/push/test:
    post:
      tags:
        - push
      summary: Gửi thử thông báo push đến thiết bị hiện tại
      operationId: testPush
      responses:
        '200':
          description: Thành công
`

const schemasToAdd = `
    ProposalInput:
      type: object
      properties:
        targetType:
          type: string
        action:
          type: string
        targetId:
          type: integer
          nullable: true
        payload:
          type: object
          nullable: true
          additionalProperties: true
      required:
        - targetType
        - action
    Proposal:
      type: object
      properties:
        id:
          type: integer
        accountId:
          type: integer
        accountName:
          type: string
        targetType:
          type: string
        action:
          type: string
        targetId:
          type: integer
          nullable: true
        payload:
          type: object
          nullable: true
          additionalProperties: true
        status:
          type: string
        note:
          type: string
          nullable: true
        baseUpdatedAt:
          type: string
          format: date-time
          nullable: true
        conflict:
          type: boolean
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - accountId
        - accountName
        - targetType
        - action
        - status
        - conflict
        - createdAt
    ProposalPage:
      type: object
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Proposal'
        totalPages:
          type: integer
      required:
        - items
        - totalPages
    ApproveProposalRequest:
      type: object
      properties:
        modifiedPayload:
          type: object
          nullable: true
          additionalProperties: true
    RejectProposalRequest:
      type: object
      properties:
        note:
          type: string
      required:
        - note
    Notification:
      type: object
      properties:
        id:
          type: integer
        type:
          type: string
        title:
          type: string
        body:
          type: string
        link:
          type: string
          nullable: true
        isRead:
          type: boolean
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - type
        - title
        - body
        - isRead
        - createdAt
    NotificationPage:
      type: object
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Notification'
        totalPages:
          type: integer
      required:
        - items
        - totalPages
    NotificationPref:
      type: object
      properties:
        notifyEvents:
          type: boolean
        notifyMemorials:
          type: boolean
        notifyProposals:
          type: boolean
        remindDaysBefore:
          type: array
          items:
            type: integer
        remindHour:
          type: string
      required:
        - notifyEvents
        - notifyMemorials
        - notifyProposals
        - remindDaysBefore
        - remindHour
    PushSubscription:
      type: object
      properties:
        endpoint:
          type: string
        keys:
          type: object
          properties:
            p256dh:
              type: string
            auth:
              type: string
          required:
            - p256dh
            - auth
      required:
        - endpoint
        - keys
    UnsubscribePushRequest:
      type: object
      properties:
        endpoint:
          type: string
      required:
        - endpoint
`

const updatedContent = content
  .replace('\ncomponents:', pathsToAdd + '\ncomponents:')
  .concat(schemasToAdd)

fs.writeFileSync('shared/api/openapi.yaml', updatedContent, 'utf8')
