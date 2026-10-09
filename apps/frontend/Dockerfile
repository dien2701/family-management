# --- Stage 1: Build Frontend bằng Node 24 ---
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files để cache npm dependencies
COPY apps/frontend/package.json apps/frontend/package-lock.json ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm ci

# Copy fixtures dùng chung và mã nguồn frontend
WORKDIR /app
COPY shared/fixtures ./shared/fixtures
COPY apps/frontend ./apps/frontend

WORKDIR /app/apps/frontend
# Client ID công khai của Google; để trống thì nút Google bị ẩn
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
# Build ra thư mục dist
RUN npm run build

# --- Stage 2: Nginx Web Server & Reverse Proxy ---
FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
