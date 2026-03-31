FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

RUN npm run build api-gateway

EXPOSE 3000

CMD ["node", "dist/apps/api-gateway/main"]
