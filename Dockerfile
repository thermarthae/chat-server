FROM node:current-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY . .
COPY --chown=node:node . .

RUN yarn install --production

USER node

EXPOSE 3000

CMD ["yarn", "run", "production"]