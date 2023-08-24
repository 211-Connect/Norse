Experimenting with Docker-izing Norse

The happy path (more automation to come):

$ docker build -t norse .
$ docker run -dp 127.0.0.1:4200:4200 --name norse norse

Now hit http://localhost:4200/ in your local browser

Watch the logs:
docker logs -f norse

---------------
Jay's ugly notes while debugging / struggling
---------------
# docker image rm --force norse; docker build --progress=plain -t norse .
docker build -t norse .
# docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse
docker container stop norse; docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse

# Shell into a running norse to poke around:
docker exec -it norse sh

# Logs (there aren't any yet):
docker logs -f norse

nx run client:serve

Discord Nightlight wrote:
If your docker container is strictly for development then you'll have to run nx run client:serve.
If it is for a production environment then you would run nx run client:build followed by cd dist/packages/client and  npm start
