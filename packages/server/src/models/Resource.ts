import { model, Schema } from 'mongoose';

const ResourceSchema = new Schema(
  {
    _id: String,
    displayName: String,
    displayPhoneNumber: String,
    website: String,
    email: String,
    phoneNumbers: [
      {
        type: {
          type: String,
        },
        number: String,
        rank: Number,
      },
    ],
    hours: String,
    applicationProcess: String,
    eligibilities: String,
    languages: [String],
    fees: String,
    requiredDocuments: String,
    tenantId: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    serviceArea: {
      description: [String],
      extent: {
        type: {
          type: String,
          enum: ['Polygon', 'MultiPolygon'],
          required: true,
        },
        coordinates: {
          type: [[[[Number]]]], // Array of arrays of arrays of numbers
          required: true,
        },
      },
    },
    organizationName: String,
    addresses: [
      {
        address_1: String,
        address_2: String,
        city: String,
        stateProvince: String,
        postalCode: String,
        country: String,
        type: {
          type: String,
        },
      },
    ],
    translations: [
      {
        locale: String,
        serviceName: String,
        serviceDescription: String,
        organizationDescription: String,
      },
    ],
    last_assured_date: String,
  },
  { timestamps: true }
);

export const Resource = model('resource', ResourceSchema);
