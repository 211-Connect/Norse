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
