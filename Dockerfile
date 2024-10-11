FROM node:18

RUN apt update
RUN apt install default-jre -y

COPY package.json ./
COPY tests/ ./

RUN npm i
RUN npx test tests/

ENTRYPOINT ["npx", "allure", "serve", "-h", "0.0.0.0", "-p", "8080"]