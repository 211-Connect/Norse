FROM node:20.14.0-alpine3.20 as base

WORKDIR /app

RUN mkdir -p ./src/lib/mongodb

COPY package*.json ./
COPY ./src/lib/mongodb/schema.prisma ./src/lib/mongodb

RUN apk add g++ make py3-pip

RUN npm install

COPY . .

RUN npm run build

FROM node:20.14.0-alpine3.20 as runtime

WORKDIR /app

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package*.json ./
COPY --from=base /app/app.defaults.json ./
COPY --from=base /app/next-i18next.config.js ./
COPY --from=base /app/next.config.mjs ./
COPY --from=base /app/postcss.config.js ./
COPY --from=base /app/tailwind.config.js ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /app/src ./src

RUN apk add g++ make py3-pip

RUN npm install --omit=dev

EXPOSE 3000
ENTRYPOINT [ "npm", "run", "start" ]