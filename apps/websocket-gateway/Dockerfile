FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/websocket-gateway ./apps/websocket-gateway

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

RUN npm run build websocket-gateway

EXPOSE 3006

CMD ["node", "dist/apps/websocket-gateway/main"]
