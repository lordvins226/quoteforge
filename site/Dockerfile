ARG BUN_VERSION=1.3.14

# Build context is the REPOSITORY ROOT, not site/:
#   docker build -f site/Dockerfile -t quoteforge-site .
# site/vite.config.ts reads the root package.json to stamp the version banner,
# so the root manifest has to be inside the image.

FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /app

COPY package.json ./package.json
COPY site/package.json site/bun.lock ./site/

WORKDIR /app/site
RUN bun install --frozen-lockfile

COPY site/ ./
RUN bun run build

FROM nginx:alpine AS runtime
COPY --from=build /app/site/dist /usr/share/nginx/html
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
