# ============================================================
# Dockerfile — chemie-lernen.org
# Multi-stage build: Minify → Hugo → Pagefind → Nginx
# ============================================================

# ---- Stage 0: Minify JS ----
FROM node:20-alpine AS minifier
RUN npm install -g terser
WORKDIR /src
COPY scripts ./scripts
COPY myhugoapp/static/js ./myhugoapp/static/js
ENV NODE_PATH=/usr/local/lib/node_modules
RUN node scripts/minify-calculators.js

# ---- Stage 1: Hugo Build ----
FROM hugomods/hugo:exts AS hugo
COPY myhugoapp /src
COPY --from=minifier /src/myhugoapp/static/js/ /src/static/js/
WORKDIR /src
RUN hugo --baseURL https://chemie-lernen.org && \
    echo "Hugo build complete: $(ls -la public/ | wc -l) entries"

# ---- Stage 2: Pagefind Search Index ----
FROM node:20-alpine AS pagefind
RUN npm install -g pagefind
COPY --from=hugo /src/public /site
RUN npx pagefind --site /site && \
    echo "Pagefind indexing complete"

# ---- Stage 3: Production Nginx ----
FROM nginx:alpine
# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf
# Copy built Hugo site
COPY --from=pagefind /site /usr/share/nginx/html
# Copy custom nginx config (API proxy to chat service)
COPY myhugoapp/static/api-proxy.conf /etc/nginx/conf.d/api-proxy.conf
LABEL org.opencontainers.image.description="chemie-lernen.org — interaktive Chemie-Lernplattform"
LABEL org.opencontainers.image.licenses="MIT"
