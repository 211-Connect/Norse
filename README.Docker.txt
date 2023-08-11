Experimenting with Docker-izing Norse

# docker image rm --force norse; docker build --progress=plain -t norse .
docker build -t norse .
# docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse
docker container stop norse; docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse

# "Log in" to a running norse to poke around:
docker exec -it norse sh

# Logs (there aren't any yet):
docker logs -f norse