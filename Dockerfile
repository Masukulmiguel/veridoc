# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Final image
FROM python:3.13-slim

# Install nginx and supervisor
RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

# Remove ALL default nginx configs
RUN rm -rf /etc/nginx/sites-enabled /etc/nginx/conf.d/* /etc/nginx/nginx.conf

# Setup backend
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Copy public assets for server-side PDF generation
COPY public/ /app/public/

# Setup frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy nginx config as the MAIN nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Setup supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
