FROM node:18-alpine

RUN npm install -g pnpm

ENV NODE_ENV=development  
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install


COPY . .
RUN pnpm run build

EXPOSE 3000  

CMD ["pnpm", "run", "dev"]