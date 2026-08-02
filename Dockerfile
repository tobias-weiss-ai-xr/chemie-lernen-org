# ============================================================
# Dockerfile — chemie-lernen.org
# Multi-stage build: Hugo → Pagefind → Nginx
# ============================================================

# ---- Stage 1: Hugo Build ----
FROM hugomods/hugo:0.154.5 AS hugo
COPY myhugoapp /src
WORKDIR /src
RUN hugo --minify --baseURL https://chemie-lernen.org && \
    echo "Hugo build complete: $(ls -la public/ | wc -l) entries"

# ---- Stage 2: Pagefind Search Index ----
FROM node:25-alpine AS pagefind
RUN npm install -g pagefind
COPY --from=hugo /src/public /site
RUN npx pagefind --site /site && \
    echo "Pagefind indexing complete"

# ---- Stage 3: Production Nginx + Node.js API ----
FROM node:25-alpine AS api-builder
WORKDIR /app
COPY api/package*.json ./
RUN npm ci --production
COPY api ./api
RUN echo "API dependencies installed"

# ---- Stage 4: Production Nginx with Node.js ----
FROM nginx:1.27-alpine
RUN apk add --no-cache nodejs npm
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=pagefind /site /usr/share/nginx/html
COPY myhugoapp/static/api-proxy.conf /etc/nginx/conf.d/api-proxy.conf
COPY --from=api-builder /app /app
COPY docker-entrypoint-api.sh /docker-entrypoint.d/99-api-server.sh
RUN chmod +x /docker-entrypoint.d/99-api-server.sh
LABEL org.opencontainers.image.source="https://github.com/tobias-weiss-ai-xr/chemie-lernen-org"
LABEL org.opencontainers.image.description="chemie-lernen.org — interaktive Chemie-Lernplattform"
LABEL org.opencontainers.image.licenses="MIT"
