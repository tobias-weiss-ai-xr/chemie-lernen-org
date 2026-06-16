# ============================================================
# Dockerfile — chemie-chat-api
# Node.js Express server with Neo4j + LiteLLM integration
# ============================================================
FROM node:20-alpine
# Use non-root user for security
USER node
WORKDIR /app
# Copy only what's needed for production
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server.js .
EXPOSE 3001
LABEL org.opencontainers.image.source="https://github.com/tobias-weiss-ai-xr/chemie-lernen-org"
LABEL org.opencontainers.image.description="chemie-lernen.org Chat API — Express + Neo4j + LiteLLM"
LABEL org.opencontainers.image.licenses="MIT"
CMD ["node", "server.js"]
