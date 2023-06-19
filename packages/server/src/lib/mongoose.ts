import mongoose, { Mongoose } from 'mongoose';

let mongooseClient: Mongoose;

export async function connect() {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!mongooseClient) {
    mongooseClient = await mongoose.connect(mongodbUri);
  }
}

export default mongoose;
