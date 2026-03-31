FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/anomaly-service ./apps/anomaly-service

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

RUN npm run build anomaly-service

CMD ["node", "dist/apps/anomaly-service/main"]
