FROM node:8-alpine
MAINTAINER butlerx <butlerx@notthe.cloud>
RUN apk add --update git build-base python postgresql-client && \
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY yarn.lock index.js package.json lib /usr/src/app/
RUN yarn && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
ENTRYPOINT ["node", "index.js"]
