# MSC EED Report — Express + Vite (Command Holodeck)
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
# Railway volume tip: mount /data and set DATABASE_PATH=/data/data.db
ENV DATABASE_PATH=/data/data.db

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
# seed snapshot + shared types are bundled into dist; keep snapshot for ops visibility
COPY server/live-snapshot.json ./server/live-snapshot.json

RUN mkdir -p /data

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
