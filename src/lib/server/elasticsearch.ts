import { Client } from '@elastic/elasticsearch';

const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_NODE as string,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY as string,
  },
  maxRetries: 5,
});

export { elasticsearch };
