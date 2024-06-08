import { Client } from '@elastic/elasticsearch';

const nodes =
  process.env?.ELASTICSEARCH_NODES?.split(',') ?? 'http://127.0.0.1';

const elasticsearch = new Client({
  nodes: nodes,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY as string,
  },
  maxRetries: 5,
});

export default elasticsearch;
export { elasticsearch };
