# ==============================================================================
# CampusBites Frontend Production Dockerfile (Multi-stage)
# ==============================================================================

# Stage 1: Build static assets with Node.js
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
