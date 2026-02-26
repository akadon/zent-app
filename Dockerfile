FROM node:22-alpine AS builder
ARG VITE_API_URL=/api
ARG VITE_WS_URL=
ARG VITE_CDN_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_CDN_URL=$VITE_CDN_URL
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
RUN npm ci 2>/dev/null || npm install
COPY . .
RUN rm -rf electron/
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/_headers /usr/share/nginx/html/_headers
RUN printf 'server {\n\
  listen 3000;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location /assets/ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
