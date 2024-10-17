FROM node:18

WORKDIR /test-suite

RUN apt update

# JRE is a dependency for the reporting software Allure
# By including this dependency, a user could overwrite the entrypoint with
# npx mocha tests/ && npx allure serve
# when invoking the image and the container will serve a 
# browsable report once the tests are finished
RUN apt install default-jre -y

COPY package.json ./
COPY tests/ ./tests

RUN npm i
CMD [ "npm", "t" ]