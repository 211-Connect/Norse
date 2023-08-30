import { model, Schema } from 'mongoose';

const FavoriteListSchema = new Schema(
  {
    name: String,
    description: String,
    privacy: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PRIVATE',
    },
    ownerId: String,
    tenantId: String,
    favorites: [
      {
        type: String,
        ref: 'resource',
      },
    ],
  },
  { timestamps: true, collection: 'favoriteLists' }
);

export const FavoriteList = model('favoriteList', FavoriteListSchema);
