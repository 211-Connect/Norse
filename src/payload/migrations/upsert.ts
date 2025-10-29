import { CollectionSlug, Payload, Where } from 'payload';

export async function upsert<I extends Record<string, unknown>, O>(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  data: I,
): Promise<O> {
  const existing = await payload.find({
    collection,
    where,
    limit: 1,
    pagination: false,
  });

  if (existing.docs.length > 0) {
    return payload.update({
      collection,
      id: existing.docs[0].id,
      data,
    }) as Promise<O>;
  }

  return payload.create({
    collection,
    data,
  }) as Promise<O>;
}
