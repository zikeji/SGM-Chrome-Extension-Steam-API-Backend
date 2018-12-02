FROM node:8
WORKDIR /usr/src/app
COPY . .
RUN npm install --only=production
ADD config.docker.js config.js
EXPOSE 8080
CMD [ "node", "src/index.js" ]