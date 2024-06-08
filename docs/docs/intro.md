---
sidebar_position: 1
---

# Getting Started

Let's discover **NORSE**.

Get started by [forking the main branch](https://github.com/211-Connect/Norse/fork).

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 18.x or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
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

Copy `.env.example`, rename to `.env.local` and set environment variables.

The document also mentions several environment variables that need to be set, which are categorized into "PUBLIC" and "SECRET." These variables are essential for configuring various aspects of the NORSE project. Here are some of the environment variables mentioned:

Public environment variables:

| Key                               | Value                                                                                                                                                                     | Info       |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------- |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | [Mapbox Access Token](https://docs.mapbox.com/api/overview/)                                                                                                              | `optional` |
| `NEXT_PUBLIC_RADAR_ACCESS_TOKEN`  | [Radar Publishable Token](https://radar.com/documentation/api#authentication)                                                                                             | `optional` |
| `NEXT_PUBLIC_GTM_CONTAINER_ID`    | [Google Tag Manager container ID](https://support.google.com/tagmanager/answer/12974036?hl=en#:~:text=In%20Tag%20Manager%2C%20click%20Workspace,as%20%22GTM%2DXXXXXX%22.) | `optional` |

Secret environment variables:

| Key                              | Value                                                                                                                                                                                                           | Info                           |
| :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| `BASE_URL`                       | The base URL where you are hosting the application (i.e. https://example.com)                                                                                                                                   | `required`                     |
| `NEXTAUTH_URL`                   | In most cases this is the same as `BASE_URL` [See NextAuth documentation](https://next-auth.js.org/getting-started/example#deploying-to-production)                                                             | `required`                     |
| `NEXTAUTH_SECRET`                | The secret that NextAuth uses to create JSON Web Tokens                                                                                                                                                         | `required`                     |
| `KEYCLOAK_SECRET`                | Keycloak client secret                                                                                                                                                                                          | `required`                     |
| `KEYCLOAK_ISSUER`                | Keycloak issuer URL                                                                                                                                                                                             | `required`                     |
| `KEYCLOAK_CLIENT_ID`             | Keycloak client ID                                                                                                                                                                                              | `required`                     |
| `TWILIO_PHONE_NUMBER`            | Phone number assigned to you when creating SMS account                                                                                                                                                          | `optional`                     |
| `TWILIO_ACCOUNT_SID`             | Twilio [String identifier](https://www.twilio.com/docs/glossary/what-is-a-sid)                                                                                                                                  | `optional`                     |
| `TWILIO_AUTH_TOKEN`              | Twilio [Auth Token](https://help.twilio.com/articles/223136027-Auth-Tokens-and-How-to-Change-Them)                                                                                                              | `optional`                     |
| `DATABASE_URL`                   | MongoDB [connection string](https://www.mongodb.com/docs/manual/reference/connection-string/) or Postgres [connection string](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS) | `required`                     |
| `ELASTICSEARCH_NODES`            | Comma delimited list of Elasticsearch [nodes](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html) (Unless you have an advanced use case, this will alway sbe a single node)      | `required` `string` `string[]` |
| `ELASTICSEARCH_API_KEY`          | Elasticsearch [api key](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html)                                                                                       | `required`                     |
| `ELASTICSEARCH_RESOURCE_INDEX`   | Elasticsearch [index](https://www.elastic.co/blog/what-is-an-elasticsearch-index) that holds your resource records                                                                                              | `required`                     |
| `ELASTICSEARCH_SUGGESTION_INDEX` | Elasticsearch [index](https://www.elastic.co/blog/what-is-an-elasticsearch-index) that holds your suggestion/taxonomy records                                                                                   | `required`                     |

These environment variables are crucial for configuring the project's behavior and connecting it to external services.

## Start the application

Run the application in development:

```bash
npm run dev
```

The `npm run dev` command builds the application locally and serves it through a development server, ready for you to view at [http://localhost:3000](http://localhost:3000).

[For advanced configuration see our Configuration section](./configuration)

## Build the application

Build the application:

```bash
npm run build
```

## Run the built application

Run the built application:

```bash
npm run start
```
