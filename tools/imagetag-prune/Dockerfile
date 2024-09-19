FROM node:20-slim

COPY package.json .

RUN npm install

COPY *.js ./

CMD [ "npm", "start" ]