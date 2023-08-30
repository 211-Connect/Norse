import mongoose from 'mongoose';
import fs from 'fs-extra';
import { resources } from './createResources';
import { Resource } from '../src/models/Resource';

async function seedMongoDb() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not set');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongodbUri);
  console.log('Connected to MongoDB');

  console.log('Seeding MongoDB...');
  const promises = resources.map((resource: any) => {
    return Resource.create(resource);
  });

  await Promise.all(promises);
  console.log('Done seeding MongoDB');

  console.log('Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');

  console.log('Writing resources to temp file...');
  fs.ensureDirSync('./tmp');
  fs.writeFileSync('./tmp/resources.json', JSON.stringify(resources, null, 2));
  console.log('Done writing resources to file');

  console.log('Stopping process...');
}

seedMongoDb();
