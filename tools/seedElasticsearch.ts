import { Client } from '@elastic/elasticsearch';
import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import { createTaxonomies } from './createTaxonomies';
import resourceMapping from './mappings/resource_index.json';
import taxonomyMapping from './mappings/taxonomy_index.json';
// @ts-ignore This gets generated in the previous step (see tools/seedMongoDb)
import resources from '../tmp/resources.json';
import { faker } from '@faker-js/faker';

const client = new Client({
  node: process.env.ELASTIC_NODE as string,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY as string,
  },
  maxRetries: 5,
});

async function seedElasticsearch() {
  console.log('Creating indexes...');
  await client.indices.create({
    index: process.env.ELASTIC_RESOURCE_INDEX as string,
    mappings: resourceMapping.mappings as MappingTypeMapping,
  });

  await client.indices.create({
    index: process.env.ELASTIC_TAXONOMY_INDEX as string,
    mappings: taxonomyMapping.mappings as MappingTypeMapping,
  });
  console.log('Indexes created');

  console.log('Indexing resources...');
  await client.bulk({
    index: process.env.ELASTIC_RESOURCE_INDEX as string,
    operations: resources.map((resource: any) => {
      return {
        index: {
          _index: process.env.ELASTIC_RESOURCE_INDEX as string,
        },
        id: resource._id,
        address_1: faker.location.streetAddress,
        city: faker.location.city,
        country: faker.location.country,
        postal_code: faker.location.zipCode,
        state: faker.location.state,
        primary_phone: faker.phone.number('###-###-####'),
        primary_website: faker.internet.url,
        display_name: resource.translations[0].displayName,
        latitude: resource.location.coordinates[1],
        longitude: resource.location.coordinates[0],
        location: resource.location,
        taxonomy_codes: resource.translations[0].taxonomies.map(
          (el: any) => el.code
        ),
        taxonomy_terms: resource.translations[0].taxonomies.map(
          (el: any) => el.name
        ),
      };
    }),
  });
  console.log('Done indexing resources');

  console.log('Indexing taxonomies...');
  const taxonomies = createTaxonomies();
  await client.bulk({
    index: process.env.ELASTIC_TAXONOMY_INDEX as string,
    operations: taxonomies.map((taxonomy: any) => {
      return {
        index: {
          _index: process.env.ELASTIC_TAXONOMY_INDEX as string,
        },
        id: taxonomy._id,
        code: taxonomy.code,
        name: taxonomy.name,
        description: taxonomy.description,
      };
    }),
  });
  console.log('Done indexing taxonomies');
}

seedElasticsearch();
