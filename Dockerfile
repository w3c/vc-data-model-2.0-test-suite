FROM node:18

WORKDIR /test-suite

RUN apt update
RUN apt install default-jre -y

COPY package.json ./
COPY tests/ ./tests
