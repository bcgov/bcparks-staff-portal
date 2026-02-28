FROM node:24.14

COPY package.json .

RUN npm install

COPY *.js ./

CMD [ "npm", "start" ]
