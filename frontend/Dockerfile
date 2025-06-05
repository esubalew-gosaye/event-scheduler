FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy project files
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]