Experimenting with Docker-izing Norse

The happy path (more automation to come):

# docker build -t norse .
docker compose up

# Create the Elasticsearch indexes we'll use:
curl -X PUT "http://localhost:9200/0-taxonomies_v2_en" \
  -H "Content-Type: application/json" -d @docker/taxonomy_index.json
curl -X PUT "http://localhost:9200/0-results_v2_en" \
  -H "Content-Type: application/json" -d @docker/resource_index.json

# Add these to your local /etc/hosts
#   Because we have to support both of these:
#     browser -> server
#     browser -> client -> server
#   This is the cleaneast solution I've found so far.
127.0.0.1 norse-server-1
127.0.0.1 norse-client-1
127.0.0.1 norse-elasticsearch-1
127.0.0.1 norse-redis-1
127.0.0.1 norse-mongodb-1

Now in your local browser:
* http://localhost:4200/ the Norse web app
* http://localhost:3001/__health the Norse API (server)
* http://localhost:9200/ Elasticsearch

Watch the logs:
docker logs -f norse-client-1
docker logs -f norse-server-1


---------------
Jay's ugly notes while debugging / struggling
---------------
# docker image rm --force norse; docker build --progress=plain -t norse .
docker compose down server client
docker container rm norse-server-1 norse-client-1
docker image rm norse
docker build -t norse .
docker compose up server client

# docker container stop norse; docker container rm norse; docker run -dp 127.0.0.1:4200:4200 --name norse norse

# Shell into the client to poke around:
docker exec -it norse-client-1 sh

curl -X DELETE "http://localhost:9200/0-taxonomies_v2_en"
curl -X DELETE "http://localhost:9200/0-results_v2_en"

Server search example:
 http://localhost:3001/search?query=foo&query_label=foo&query_type=text&tenant=7&page=1


Discord Nightlight wrote:
If your docker container is strictly for development then you'll have to run nx run client:serve.
If it is for a production environment then you would run nx run client:build followed by cd dist/packages/client and  npm start
