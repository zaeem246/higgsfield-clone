# Gateway container image.
#
# Vercel's Hono preset builds its own entrypoint from source and then cannot
# resolve the dependencies it emitted requires for. A container sidesteps the
# preset entirely: we compile and install exactly as we do locally, so what runs
# in production is what passed the smoke test on a laptop.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
# Production dependencies only — the build stage kept typescript and esbuild.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# The platform injects PORT; env.ts reads it and falls back to 4000 locally.
EXPOSE 4000
CMD ["node", "dist/index.js"]
