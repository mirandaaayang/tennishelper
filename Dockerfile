FROM node:20-slim

# OS deps (Playwright needs these)
RUN apt-get update && apt-get install -y wget gnupg ca-certificates procps libxss1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Install ALL deps (prod + dev) so build tools exist
COPY package*.json ./
RUN npm ci

# 2) Copy the rest of your code
COPY . .

# 3) Install Playwright browser + OS deps inside the image
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# 4) Build (uses vite & esbuild from devDependencies)
RUN npm run build

# 5) Remove dev deps to slim the runtime image
RUN npm prune --omit=dev

# Render sets PORT; make sure your app reads process.env.PORT
EXPOSE 5000
CMD ["npm","start"]
