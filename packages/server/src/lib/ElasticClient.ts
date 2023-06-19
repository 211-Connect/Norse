import { Client } from '@elastic/elasticsearch';

const ElasticClient = new Client({
  node: process.env.ELASTIC_NODE as string,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY as string,
  },
  maxRetries: 5,
});

export { ElasticClient };
