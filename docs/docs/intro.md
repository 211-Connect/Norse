---
sidebar_position: 1
---

# Intro

Let's discover **NORSE**.

## Getting Started

Get started by [forking the main branch](https://github.com/211-Connect/Norse/fork).

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 18.x or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Redis](https://redis.io/download/) latest stable version.
- [MongoDB](https://www.mongodb.com/download-center/community/releases) version 6.x.
- [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) version 8.x.
- [Keycloak](https://www.keycloak.org/downloads) version 21.x.

## Install dependencies

```bash
npm install
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command installs all necessary dependencies you need to run Norse.


## Environment Variables
  The document also mentions several environment variables that need to be set, which are categorized into "PUBLIC" and "SECRET." These variables are essential for configuring various aspects of the NORSE project. Here are some of the environment variables mentioned:

PUBLIC Variables:
- `NEXT_PUBLIC_MAPBOX_API_KEY`: Mapbox API key(get from [mapbox api](https://docs.mapbox.com/api/overview/) )
- `NEXT_PUBLIC_GTM_CONTAINER_ID`: Google Tag Manager container ID
- `NEXT_PUBLIC_API_URL`: API URL (http://localhost:3001 in this case)
- `NEXT_PUBLIC_TENANT_ID`: Tenant ID ("0" in this case)
- `NEXT_PUBLIC_MAPBOX_STYLE_URL`: Mapbox style URL
- `NEXT_PUBLIC_KEYCLOAK_REALM`: Keycloak realm


SECRET Variables:

- `NEXTAUTH_URL`: Next.js authentication URL (http://localhost:4200 in this case)
- `NEXTAUTH_SECRET`: Next.js authentication secret
- `KEYCLOAK_SECRET`: Keycloak secret
- `KEYCLOAK_ISSUER`: Keycloak issuer
- `KEYCLOAK_CLIENT_ID`: Keycloak client ID


These environment variables are crucial for configuring the project's behavior and connecting it to external services.

Overall, this document provides a comprehensive guide on setting up and configuring the NORSE project for development. Users who want to work on this project or deploy it will find these instructions helpful.

Example: 
  ```env
  # PUBLIC
  NEXT_PUBLIC_MAPBOX_API_KEY=""
  NEXT_PUBLIC_GTM_CONTAINER_ID=""
  NEXT_PUBLIC_API_URL="http://localhost:3001"
  NEXT_PUBLIC_TENANT_ID="0"
  NEXT_PUBLIC_MAPBOX_STYLE_URL=""
  NEXT_PUBLIC_KEYCLOAK_REALM=""

  # SECRET
  NEXTAUTH_URL="http://localhost:4200"
  NEXTAUTH_SECRET=""
  KEYCLOAK_SECRET=""
  KEYCLOAK_ISSUER=""
  KEYCLOAK_CLIENT_ID=""
```

## Start the client

Run the api:

```bash
nx serve client
```

The `nx serve client` commands builds the application locally and serves it through a development server, ready for you to view at [http://localhost:4200](http://localhost:4200).

## Start the server

In a seperate terminal, run the development server:

```bash
nx serve server
```

The `nx serve server` commands starts the api server, ready for programmatic access at [http://localhost:3001](http://localhost:3001).
