Experimenting with Docker-izing Norse

# docker image rm --force norse; docker build --progress=plain -t norse .
docker build -t norse .
# docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse
docker container stop norse; docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse

# Shell into a running norse to poke around:
docker exec -it norse sh

# Logs (there aren't any yet):
docker logs -f norse

# Unfortunately, this explodes:
#   https://gist.github.com/jhannah/46f621c4faa040a4bb20b64f7bfa3d13

# Necessary? not?
nx run client:build

nx serve client

