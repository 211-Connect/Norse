import { faker } from '@faker-js/faker';
import { mongo } from 'mongoose';

const taxonomyCodes = [
  'BV-8900.1700-300',
  'BV-8900.9125-920',
  'BV-8900.9300-180',
  'BV-8900.93-250',
  'BV-8900.93-300',
  'BV-8900.93-950',
];

export function createTaxonomies() {
  return taxonomyCodes.map((code) => createTaxonomy(code));
}

export function createTaxonomy(code: string): any {
  return {
    _id: new mongo.ObjectId(),
    code: code,
    name: faker.lorem.words(2),
    description: faker.lorem.paragraph(),
  };
}
