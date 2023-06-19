import { model, Schema } from 'mongoose';

const RedirectSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    newId: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

RedirectSchema.index({ newId: 1 });
RedirectSchema.index({ newId: 1, tenantId: 1 });

export const Redirect = model('redirect', RedirectSchema);
