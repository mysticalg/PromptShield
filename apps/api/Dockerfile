FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm ci --omit=dev
COPY apps/api/dist ./apps/api/dist
COPY packages/core/dist ./packages/core/dist

EXPOSE 4000
ENTRYPOINT ["node"]
CMD ["apps/api/dist/apps/api/src/index.js"]
