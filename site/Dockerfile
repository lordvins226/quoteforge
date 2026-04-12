ARG BUN_VERSION=1.2.10

FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /repo

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libatk-bridge2.0-0 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json bun.lock ./
COPY site/package.json ./site/
RUN bun install --frozen-lockfile
RUN cd site && bun install --frozen-lockfile

COPY . .

RUN bun run --cwd site render-samples
RUN bun run --cwd site build

FROM nginx:alpine AS runtime
COPY --from=build /repo/site/dist /usr/share/nginx/html
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
