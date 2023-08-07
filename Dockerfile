FROM node:18-alpine
WORKDIR /app

# Do these first so Docker can cache the result for faster DEV cycles
# (we can build in 1 second instead of 5 minutes)
COPY package.json package.json
RUN npm install
RUN npm install --global nx@latest

# This invalidates all Docker caches, so do this last for faster DEV cycles
COPY . .

# ----------------
# The real "start the client"
#   CMD ["nx", "serve", "client"]
# Debugging - keep running forever
ENTRYPOINT ["tail", "-f", "/dev/null"]
# ----------------

EXPOSE 4200

