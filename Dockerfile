FROM node:24-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install
COPY . .
ENV NODE_ENV=production
CMD ["node", "scripts/benchmark_decision_engine.mjs"]
