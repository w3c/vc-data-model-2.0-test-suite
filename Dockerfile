FROM node:18

WORKDIR /test-suite

COPY package.json ./
COPY tests/ ./tests

RUN npm i
CMD [ "npm", "t" ]