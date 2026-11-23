
# ==========================================
# Etapa 1: dependencias de producción
# ==========================================
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force


# ==========================================
# Etapa 2: imagen final
# ==========================================
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules

COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

RUN mkdir -p uploads logs \
    && chown -R node:node uploads logs

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
