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

# Keycloak 
#   Here's a long version: https://www.aloneguid.uk/posts/2021/05/keycloak-docker/
#   But I found it in edge/testing, so let's use that instead?
#     WHOOPS! This WAS here two weeks ago, no longer exists.
#     0.688 fetch https://dl-cdn.alpinelinux.org/alpine/edge/testing/x86_64/APKINDEX.tar.gz
#     So umm... just comment out for now.
# RUN echo 'https://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories
# RUN apk add keycloak
# keytool      ... there's no way to see the version?

# --------------------------------------------
# This invalidates all Docker caches, so do this LAST for faster DEV cycles
COPY . .

# -------------------------
# All these rumors sent to me via Slack / Discord. I don't know what these do...
# These should end up in a config file somewhere?
ENV NEXT_PUBLIC_MAPBOX_API_KEY=""
ENV NEXT_PUBLIC_GTM_CONTAINER_ID=""
ENV NEXT_PUBLIC_API_URL="http://localhost:3001"
ENV NEXT_PUBLIC_TENANT_ID="0"
ENV NEXT_PUBLIC_MAPBOX_STYLE_URL=""
# Required Next Auth environment variables
ENV NEXTAUTH_URL="http://localhost:4200"
ENV NEXTAUTH_SECRET="12345"
# -------------------------

# ----------------
# The real "start the client"
ENV ELASTIC_NODE="http://norse-elasticsearch-1:9200"
ENV REDIS_URL="redis://norse-redis-1:6379"
ENV MONGODB_URI="mongodb://norse-mongodb-1:27017"
# Squash these 2 together so we can build running neither, but "docker compose up" will run both:
# CMD ["/bin/sh", "-c", "nx serve server &; nx run client:serve"]
CMD ["/bin/sh", "-c", "nx run-many --target=serve --projects=server,client --parallel"]
# Debugging - keep running forever
# ENTRYPOINT ["tail", "-f", "/dev/null"]
# ----------------
EXPOSE 4200
EXPOSE 3001
