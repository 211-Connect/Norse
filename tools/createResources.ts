import { faker } from '@faker-js/faker';
import { mongo } from 'mongoose';

const addressTypes = ['physical', 'mailing'];
const phoneTypes = ['voice', 'fax', 'sms'];
const taxonomyCodes = [
  'BV-8900.1700-300',
  'BV-8900.9125-920',
  'BV-8900.9300-180',
  'BV-8900.93-250',
  'BV-8900.93-300',
  'BV-8900.93-950',
];

export function createRandomResource(): any {
  return {
    _id: new mongo.ObjectId(),
    organizationName: faker.company.name(),
    website: faker.internet.url(),
    email: faker.internet.email(),
    phoneNumbers: faker.helpers.multiple(createRandomPhone, {
      count: {
        min: 1,
        max: 3,
      },
    }),
    location: {
      type: 'Point',
      coordinates: [
        faker.number.float({ min: -180, max: 180, precision: 0.000001 }),
        faker.number.float({ min: -90, max: 90, precision: 0.000001 }),
      ],
    },
    addresses: faker.helpers.multiple(createRandomAddress, {
      count: {
        min: 1,
        max: 3,
      },
    }),
    translations: [
      {
        displayName: faker.company.name(),
        fees: faker.lorem.paragraph(),
        eligibilities: faker.lorem.paragraph(),
        hours: faker.lorem.paragraph(),
        locale: 'en',
        requiredDocuments: faker.lorem.paragraph(),
        applicationProcess: faker.lorem.paragraph(),
        description: faker.lorem.paragraph(),
        organizationDescription: faker.lorem.paragraph(),
        taxonomies: faker.helpers.multiple(createRandomTaxonomy, {
          count: {
            min: 1,
            max: 6,
          },
        }),
      },
    ],
  };
}

export const resources: any = faker.helpers.multiple(createRandomResource, {
  count: 1000,
});

export function createRandomPhone(): any {
  return {
    rank: faker.number.int({ min: 0, max: 3 }),
    type: faker.helpers.arrayElement(phoneTypes),
    number: faker.phone.number('###-###-####'),
  };
}

export function createRandomAddress(): any {
  return {
    rank: faker.number.int({ min: 0, max: 3 }),
    type: faker.helpers.arrayElement(addressTypes),
    address_1: faker.location.streetAddress(),
    address_2: '',
    city: faker.location.city(),
    country: faker.location.country(),
    stateProvince: faker.location.state(),
    postalCode: faker.location.zipCode(),
  };
}

export function createRandomTaxonomy(): any {
  return {
    code: faker.helpers.arrayElement(taxonomyCodes),
    name: faker.lorem.words(2),
  };
}
