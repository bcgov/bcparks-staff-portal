FROM --platform=linux/amd64 node:24-slim

COPY package.json .

RUN npm install

COPY *.js ./

CMD [ "npm", "start" ]