FROM node:18

WORKDIR /test-suitegit status

COPY package.json ./
COPY tests/ ./tests

RUN npm i
CMD [ "npm", "t" ]