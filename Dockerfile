FROM node:18

WORKDIR /test-suite

COPY package.json respecConfig.json abstract.hbs ./
COPY tests/ ./tests
COPY reports/ ./reports

RUN npm i
RUN npm install --global serve
CMD [ "npm", "t" ]
