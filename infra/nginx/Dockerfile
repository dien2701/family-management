# Build context = gốc repo:  docker build -f infra/nginx/Dockerfile .
# --- Stage 1: build frontend ---
FROM node:24-alpine AS builder
WORKDIR /app/apps/frontend
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

WORKDIR /app
COPY shared/fixtures ./shared/fixtures
COPY apps/frontend ./apps/frontend

# Client ID công khai của Google; để trống thì nút Google bị ẩn
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /app/apps/frontend
RUN npm run build

# --- Stage 2: nginx (HTTPS, reverse proxy /api) ---
FROM nginx:alpine
RUN apk add --no-cache openssl
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY infra/nginx/40-certs.sh /docker-entrypoint.d/40-certs.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-certs.sh && chmod +x /docker-entrypoint.d/40-certs.sh
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80 443
