import postgres from '.';
import { range } from '../utils';
import { faker } from '@faker-js/faker';
import { elasticsearch } from '../elasticsearch';
import resourceMapping from '../elasticsearch/resource_mapping.json';
import { MappingProperty } from '@elastic/elasticsearch/lib/api/types';

let isFirst = true;
function createRandomAddress() {
  const rank = isFirst ? 1 : 2;
  const type = isFirst
    ? 'physical'
    : faker.helpers.arrayElement(['physical', 'virtual', 'mailing']);
  if (isFirst) isFirst = false;

  return {
    city: faker.location.city(),
    country: faker.location.country(),
    address_1: faker.location.streetAddress(),
    postal_code: faker.location.zipCode(),
    state: faker.location.state(),
    rank: rank,
    type: type,
  };
}

function createRandomPhoneNumber() {
  return {
    number: faker.phone.number(),
    rank: 1,
    type: 'voice',
  };
}

function createRandomResource() {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    phone_number: faker.phone.number(),
    website: faker.internet.url(),
    addresses: faker.helpers.multiple(createRandomAddress, { count: 3 }),
    phone_numbers: faker.helpers.multiple(createRandomPhoneNumber, {
      count: 3,
    }),
    service_area: {
      type: 'Polygon',
      coordinates: [[[faker.location.longitude(), faker.location.latitude()]]],
    },
    location: {
      type: 'Point',
      coordinates: [faker.location.longitude(), faker.location.latitude()],
    },
    last_assured_date: faker.date.past(),
    created_at: faker.date.past(),
  };
}

function createRandomResourceTranslation() {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    service_name: faker.company.catchPhraseNoun(),
    description: faker.lorem.sentences(10),
    fees: faker.lorem.sentence(),
    hours: faker.lorem.sentence(),
    locale: 'en',
    eligibilities: faker.lorem.sentence(),
    application_process: faker.lorem.sentence(),
    taxonomies: faker.helpers.multiple(
      () => ({
        name: faker.lorem.word(),
        code: faker.lorem.word(),
      }),
      { count: 3 },
    ),
    required_documents: ['Photo ID'],
    languages: ['English', 'Spanish'],
    organization: {
      name: faker.company.name(),
      description: faker.lorem.sentences(5),
    },
  };
}

const index = process.env.ELASTICSEARCH_RESOURCE_INDEX + '_en';
async function main() {
  const total = range(0, 100);

  await postgres.resource.deleteMany();

  try {
    await elasticsearch.indices.create({
      index: index,
      mappings: {
        properties: resourceMapping as Record<string, MappingProperty>,
      },
    });
  } catch (err) {
    console.log(err?.meta?.body?.error?.reason ?? err);
  }

  await elasticsearch.deleteByQuery({
    index: index,
    query: {
      match_all: {},
    },
  });

  for (const _ of total) {
    isFirst = true;
    const resource = createRandomResource();
    const resource_translation = createRandomResourceTranslation();

    await postgres.resource.create({
      data: {
        ...resource,
        translations: {
          create: resource_translation,
        },
      },
    });

    const primaryAddress = resource.addresses.find(
      (addr) => addr.rank === 1 && addr.type === 'physical',
    );
    await elasticsearch.index({
      index: index,
      id: resource.id,
      document: {
        email: resource.email,
        phone: resource.phone_number,
        website: resource.website,
        display_email: resource.email,
        display_phone_number: resource.phone_number,
        display_website: resource.website,
        organization_name: resource_translation.organization.name,
        organization_alternate_name: null,
        organization_description: resource_translation.organization.description,
        organization_short_description: null,
        location_latitude: resource.location[1],
        location_longitude: resource.location[0],
        service_name: resource_translation.service_name,
        service_alternate_name: null,
        service_description: resource_translation.description,
        location_name: null,
        location_alternate_name: null,
        location_description: null,
        location_short_description: null,
        display_name: resource_translation.name,
        display_alternate_name: null,
        display_description: resource_translation.description,
        display_short_description: null,
        address_1: primaryAddress.address_1,
        city: primaryAddress.city,
        state: primaryAddress.state,
        postal_code: primaryAddress.postal_code,
        physical_address: primaryAddress.address_1,
        physical_address_1: primaryAddress.address_1,
        physical_address_2: null,
        physical_address_city: primaryAddress.city,
        physical_address_state: primaryAddress.state,
        physical_address_country: primaryAddress.country,
        physical_address_postal_code: primaryAddress.postal_code,
        taxonomy_terms: [],
        taxonomy_descriptions: [],
        taxonomy_codes: [],
        primary_phone: resource.phone_number,
        primary_website: resource.website,
        location: resource.location,
        location_coordinates: resource.location,
        service_area: null,
      },
    });
  }
}

main();
