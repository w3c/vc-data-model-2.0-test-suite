FROM node:18

WORKDIR /test-suite

RUN apt update
RUN apt install default-jre -y

COPY package.json ./
COPY tests/ ./tests

# RUN npm i
# RUN npx mocha tests/

# ENTRYPOINT ["npx", "allure", "serve", "-h", "0.0.0.0", "-p", "8080"]