FROM node:18-alpine
WORKDIR /app

# Do all of these first so Docker can cache the result for faster DEV cycles
# (we can "build" (from cache) in 2 seconds instead of 5 minutes)
COPY package.json package.json
COPY package-lock.json package-lock.json
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

# ---------------
# Hmmm... trying separate container instead
# ---------------
# RUN apk add elasticsearch
#RUN mkdir /usr/share/java/elasticsearch/config
#RUN touch /usr/share/java/elasticsearch/config/jvm.options
#RUN mkdir /usr/share/java/elasticsearch/logs
#RUN echo "-XX:+IgnoreUnrecognizedVMOptions" >> /etc/elasticsearch/jvm.options
#RUN adduser -D elastic
#RUN chown -R elastic /usr/share/java/elasticsearch
#RUN chown elastic /etc/elasticsearch
#RUN mkdir /var/lib/elasticsearch
#RUN chown elastic /var/lib/elasticsearch
#USER elastic
#RUN mkdir /var/lib/elasticsearch/_default
#RUN mkdir /var/lib/elasticsearch/_default/plugins
#ENV ES_PATH_CONF=/etc/elasticsearch
## RUN /usr/share/java/elasticsearch/bin/elasticsearch --daemonize
## netstat -tulpn | grep LISTEN
## [2023-08-24T20:49:11,039][INFO ][o.e.t.TransportService   ] [6FBgtWt] publish_address {127.0.0.1:9300}, bound_addresses {127.0.0.1:9300}
#USER root
# ---------------

# Keycloak 
#   Here's a long version: https://www.aloneguid.uk/posts/2021/05/keycloak-docker/
#   But I found it in edge/testing, so let's use that instead?
#     WHOOPS! This WAS here two weeks ago, no longer exists.
#     0.688 fetch https://dl-cdn.alpinelinux.org/alpine/edge/testing/x86_64/APKINDEX.tar.gz
#     So umm... just comment out for now.
# RUN echo 'https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories
# RUN apk add keycloak
# keytool      ... there's no way to see the version?

# Per PR https://github.com/jhannah/Norse/pull/1
# This line and the one following should be removed. These get generated at run/build time
#COPY packages/client/next.config.js packages/client/.norse/next.config.js
#COPY packages/client/next-i18next.config.js packages/client/.norse/next-i18next.config.js

# --------------------------------------------
# This invalidates all Docker caches, so do this LAST for faster DEV cycles
COPY . .

# These should end up in a config file somewhere?
ENV NEXT_PUBLIC_MAPBOX_API_KEY=""
ENV NEXT_PUBLIC_GTM_CONTAINER_ID=""
ENV NEXT_PUBLIC_API_URL="http://localhost:3001"
ENV NEXT_PUBLIC_TENANT_ID="0"
ENV NEXT_PUBLIC_MAPBOX_STYLE_URL=""

# Required Next Auth environment variables
ENV NEXTAUTH_URL="http://localhost:4200"
ENV NEXTAUTH_SECRET="12345"

# ----------------
# The real "start the client"
CMD ["nx", "run", "client:serve"]
# Debugging - keep running forever
# ENTRYPOINT ["tail", "-f", "/dev/null"]
# ----------------
EXPOSE 4200
