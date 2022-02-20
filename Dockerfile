FROM node:14

ENV PORT 1337
ENV HOST 0.0.0.0
ENV NODE_ENV production

WORKDIR /app
ADD ./package.json /app
ADD ./yarn.lock /app
RUN yarn install --frozen-lockfile

ADD . /app
RUN yarn build

EXPOSE 1337

CMD ["yarn", "start"]
