FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

COPY libs ./libs
COPY apps/action-service ./apps/action-service

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

RUN npm run build action-service

EXPOSE 3005

CMD ["node", "dist/apps/action-service/main"]
