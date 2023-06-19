import { model, Schema } from 'mongoose';

const ShortenedUrlSchema = new Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortId: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, collection: 'shortenedUrls' }
);

ShortenedUrlSchema.index(
  { originalUrl: 1, tenantId: 1, type: 1 },
  { unique: true }
);
ShortenedUrlSchema.index({ shortId: 1, tenantId: 1 }, { unique: true });

export const ShortenedUrl = model('shortenedUrl', ShortenedUrlSchema);
