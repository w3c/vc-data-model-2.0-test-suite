FROM node:18

WORKDIR /test-suite

COPY package.json respecConfig.json abstract.hbs ./
COPY tests/ ./tests
COPY reports/ ./reports

RUN npm i
CMD [ "npm", "t" ]
