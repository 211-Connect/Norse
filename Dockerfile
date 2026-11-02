# Three images from one Dockerfile (docs/cms-app-separation-plan.md):
#   docker build --target app .  public directory, no database, no Payload
#   docker build --target cms .  Payload CMS: admin, API, jobs, migrations
#   docker build .               both in one process (NORSE_ROLE picks)
# NEXT_PUBLIC_CUSTOM_BASE_PATH and NEXT_PUBLIC_WITH_TRAILING_SLASHES are baked
# into the build, so MBOA (/adresources) needs its own images.
FROM node:24-bookworm-slim AS base

FROM base AS dependency-installer
WORKDIR /opt/norse/deps
COPY package*.json .npmrc ./
RUN npm ci && npm install --include=optional sharp@0.34.5

FROM base AS source
WORKDIR /opt/norse/build
COPY --from=dependency-installer /opt/norse/deps/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_MAPBOX_API_KEY
ARG NEXT_PUBLIC_MAPBOX_STYLE_URL
ARG NEXT_PUBLIC_MAPLIBRE_STYLE_URL
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL
ARG NEXT_PUBLIC_ALLOW_SEARCH_ENGINES
ARG NEXT_PUBLIC_CUSTOM_BASE_PATH
ARG NEXT_PUBLIC_WITH_TRAILING_SLASHES
ENV NEXT_PUBLIC_MAPBOX_API_KEY=$NEXT_PUBLIC_MAPBOX_API_KEY
ENV NEXT_PUBLIC_MAPBOX_STYLE_URL=$NEXT_PUBLIC_MAPBOX_STYLE_URL
ENV NEXT_PUBLIC_MAPLIBRE_STYLE_URL=$NEXT_PUBLIC_MAPLIBRE_STYLE_URL
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=${NEXT_PUBLIC_UMAMI_SCRIPT_URL}
ENV NEXT_PUBLIC_ALLOW_SEARCH_ENGINES=$NEXT_PUBLIC_ALLOW_SEARCH_ENGINES
ENV NEXT_PUBLIC_CUSTOM_BASE_PATH=$NEXT_PUBLIC_CUSTOM_BASE_PATH
ENV NEXT_PUBLIC_WITH_TRAILING_SLASHES=$NEXT_PUBLIC_WITH_TRAILING_SLASHES

# Target builds: NORSE_BUILD is inlined by Next.js, and the routes the target
# never serves are deleted from this throwaway copy before building.
FROM source AS builder-app
ENV NORSE_BUILD=app
RUN node bin/prepare-build-target.mjs app --yes && npm run build

FROM source AS builder-cms
ENV NORSE_BUILD=cms
RUN node bin/prepare-build-target.mjs cms --yes \
    && npm run build \
    && npm prune --omit=dev

FROM source AS builder
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
WORKDIR /opt/norse/app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && apt-get update \
    && apt-get install --no-install-recommends -y tini=0.19.0-1+b3 \
    && rm -rf /var/lib/apt/lists/* \
    && chown nextjs:nodejs /opt/norse/app
ENV HOME=/opt/norse/app
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ARG PORT=3000
ENV PORT=$PORT
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]

# Public app: the standalone server only. No Payload, no migrations, no
# database client; reads CMS data from PAYLOAD_CMS_URL.
FROM runtime AS app
COPY --from=builder-app --chown=nextjs:nodejs /opt/norse/build/.next/standalone ./
COPY --from=builder-app --chown=nextjs:nodejs /opt/norse/build/.next/static ./.next/static
COPY --from=builder-app --chown=nextjs:nodejs /opt/norse/build/public ./public
USER nextjs
ENV NORSE_BUILD=app
CMD ["node", "server.js"]

# CMS: migrates the database on start, then serves.
FROM runtime AS cms
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/node_modules ./node_modules
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/tsconfig.json ./
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/src ./src
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/.next/standalone ./
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/.next/static ./.next/static
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/public ./public
COPY --from=builder-cms --chown=nextjs:nodejs /opt/norse/build/bin ./bin
USER nextjs
ENV PAYLOAD_CONFIG_PATH=src/payload/payload-config.ts
ENV NORSE_BUILD=cms
CMD ["sh", "-c", "npx payload migrate && exec node server.js"]

# Default: both halves in one image, as before the split. NORSE_ROLE picks
# the role at runtime; only a role with Payload migrates.
FROM runtime AS runner
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/src ./src
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/public ./public
COPY --from=builder --chown=nextjs:nodejs /opt/norse/build/bin ./bin
USER nextjs
ENV PAYLOAD_CONFIG_PATH=src/payload/payload-config.ts
CMD ["sh", "-c", "if [ \"$NORSE_ROLE\" != app ]; then npx payload migrate || exit 1; fi; exec node server.js"]
