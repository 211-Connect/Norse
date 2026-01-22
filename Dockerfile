FROM node:24-bookworm-slim AS base

FROM base AS dependency-installer
WORKDIR /opt/norse/deps
COPY package*.json ./
RUN npm ci && npm install --include=optional sharp@0.34.5

FROM base AS builder
WORKDIR /opt/norse/build
COPY --from=dependency-installer /opt/norse/deps/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

FROM base AS runner
WORKDIR /opt/norse/app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && apt-get update \
    && apt-get install --no-install-recommends -y tini=0.19.0-1+b3 \
    && rm -rf /var/lib/apt/lists/* \
    && chown nextjs:nodejs /opt/norse/app
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/public ./public
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/src ./src
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/tsconfig.json ./tsconfig.json
EXPOSE 3000
USER nextjs
ENV PAYLOAD_CONFIG_PATH=src/payload/payload-config.ts
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG PORT=3000
ENV PORT=$PORT
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node server.js"]
