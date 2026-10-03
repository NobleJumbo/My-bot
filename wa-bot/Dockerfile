FROM node:24-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npx puppeteer browsers install chrome

COPY . .

CMD ["node", "bot.js"]