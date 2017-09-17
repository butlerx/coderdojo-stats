FROM node:8-alpine
MAINTAINER butlerx <cian@coderdojo.org>
RUN apk add --update git build-base python postgresql-client && \
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app/
RUN yarn && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
VOLUME /usr/src/app/stats
ENTRYPOINT ["node", "index.js"]
