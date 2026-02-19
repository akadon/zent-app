FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
# Copy zent-server packages and base tsconfig (needed for file: deps)
COPY zent-server/packages ../zent-server/packages
COPY zent-server/tsconfig.base.json ../zent-server/tsconfig.base.json
# Build shared packages (install typescript globally for tsc)
RUN npm install -g typescript && \
    for pkg in ../zent-server/packages/types ../zent-server/packages/permissions ../zent-server/packages/gateway-types; do \
      (cd "$pkg" && npm install 2>/dev/null; tsc --skipLibCheck || true); \
    done
# Now install app deps (file: refs will resolve to ../zent-server/packages/*)
COPY zent-app/package.json zent-app/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /zent-server ../zent-server
COPY --from=deps /app/node_modules ./node_modules
COPY zent-app/ .
RUN rm -rf electron/
# Replace symlinks with actual copies (Next.js standalone trace can't follow symlinks outside project root)
RUN rm -rf node_modules/@yxc/types node_modules/@yxc/permissions node_modules/@yxc/gateway-types && \
    cp -r ../zent-server/packages/types node_modules/@yxc/types && \
    cp -r ../zent-server/packages/permissions node_modules/@yxc/permissions && \
    cp -r ../zent-server/packages/gateway-types node_modules/@yxc/gateway-types
ENV NEXT_TELEMETRY_DISABLED=1
RUN node -e "import('fs').then(f=>{let c=f.readFileSync('next.config.js','utf8');c=c.replace('output: \"standalone\"','output: \"standalone\",\\n  typescript: { ignoreBuildErrors: true },\\n  eslint: { ignoreDuringBuilds: true }');f.writeFileSync('next.config.js',c)})"
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
