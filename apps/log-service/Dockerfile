FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Copy libs and apps
COPY libs ./libs
COPY apps/log-service ./apps/log-service

RUN npm install
RUN npx prisma generate --schema libs/database/prisma/schema.prisma

# Build the specific app
RUN npm run build log-service

EXPOSE 3001

CMD ["node", "dist/apps/log-service/main"]
