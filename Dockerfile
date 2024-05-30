FROM node:lts-alpine as base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:lts-alpine as runtime

WORKDIR /app

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package*.json ./
COPY --from=base /app/app.config.json ./
COPY --from=base /app/next-i18next.config.js ./
COPY --from=base /app/next.config.mjs ./

RUN npm install --omit=dev

EXPOSE 3000
ENTRYPOINT [ "npm", "run", "start" ]