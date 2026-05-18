FROM node:24-alpine3.23 AS base

RUN npm install --ignore-scripts -g corepack@latest
RUN corepack enable
RUN corepack prepare pnpm@10.32.1 --activate
RUN apk update && apk add --no-cache g++ gcc make python3

WORKDIR /app
COPY . .

RUN pnpm install --ignore-scripts

CMD ["pnpm", "--filter", "@continium/worker", "start"]
