FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/ai-service ./apps/ai-service

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

RUN npm run build ai-service

CMD ["node", "dist/apps/ai-service/main"]
