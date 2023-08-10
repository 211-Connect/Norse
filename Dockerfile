FROM node:18-alpine
WORKDIR /app

# Do all of these first so Docker can cache the result for faster DEV cycles
# (we can "build" (from cache) in 2 seconds instead of 5 minutes)
COPY package.json package.json
RUN npm install
RUN npm install --global nx@latest
# nx --version     v16.6.0

RUN apk update
RUN apk upgrade

RUN apk add redis   
# redis-cli --version     7.0.12

# MongoDB https://linux.how2shout.com/how-to-install-mongodb-server-on-alpine-linux/
# Looks like Alpine 3.9 is the latest to have MongoDB APKs :(
# (We're on Alpine 3.18 according to /etc/os-release)
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/v3.9/main'      >> /etc/apk/repositories
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories
RUN apk add mongodb
# Don't need these? Yet?
# apk add mongodb-tools
# mkdir -p /data/db/
# chown `root` /data/db
# rc-update add mongodb default
# rc-service mongodb start
# mongo --version     v4.0.5
# mongo

RUN apk add elasticsearch
# uhhh... that installed it? But no idea how to use it...
# It looks like a bunch of stuff installed in /usr/share/java/elasticsearch

# Keycloak 
#   Here's a long version: https://www.aloneguid.uk/posts/2021/05/keycloak-docker/
#   But I found it in edge/testing, so let's use that instead?
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories
RUN apk add keycloak
# keytool      ... there's no way to see the version?

COPY packages/client/next.config.js packages/client/.norse/next.config.js
# --------------------------------------------
# This invalidates all Docker caches, so do this LAST for faster DEV cycles
COPY . .

# ----------------
# The real "start the client"
#   CMD ["nx", "serve", "client"]
# Debugging - keep running forever
ENTRYPOINT ["tail", "-f", "/dev/null"]
# ----------------
EXPOSE 4200
