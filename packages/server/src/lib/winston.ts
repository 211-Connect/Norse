import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { ElasticClient } from './ElasticClient';

export const logger = winston.createLogger({
  // Here we are adding a custom level called `search`
  // so that we can log search queries alongside other
  // messages
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    search: 4,
    verbose: 5,
    debug: 6,
  },
  transports: [],
});

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  // If we're in production then log to `search-analytics` with the Elasticsearch transport
  logger.add(
    new ElasticsearchTransport({
      level: 'search',
      indexPrefix: 'search-analytics',
      indexSuffixPattern: 'YYYY.MM.DD',
      client: ElasticClient,
      ensureIndexTemplate: true,
      indexTemplate: {
        '@timestamp': {
          type: 'date',
        },
        severity: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        message: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        sessionId: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        tenantId: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        search: {
          type: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
              },
            },
          },
          query: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
              },
            },
          },
          taxonomies: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
              },
            },
          },
          total: {
            type: 'integer',
          },
          facets: {
            type: 'object',
          },
          location: {
            type: 'point',
          },
          distance: {
            type: 'short',
          },
        },
      },
    })
  );

  logger.add(
    new ElasticsearchTransport({
      level: 'info',
      index: 'logs-app-api',
      dataStream: true,
      client: ElasticClient,
    })
  );
} else {
  // If we're not in production then log to the `console` with the console transport
  logger.add(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.simple(),
    })
  );
}
