import { isObject } from 'radash';

export const flattenAttributes = (obj: any): any => {
  if (!isObject(obj)) return obj;

  // Flatten { data: { ... } } or { data: [ ... ] }
  if ('data' in obj) {
    const data = obj.data;
    if (Array.isArray(data)) {
      return data.map(flattenAttributes);
    }
    if (isObject(data)) {
      return flattenAttributes(data);
    }
    return data; // null, undefined, or primitive
  }

  // Flatten { attributes: { ... }, id }
  if ('attributes' in obj && isObject(obj.attributes) && 'id' in obj) {
    return flattenAttributes({ id: obj.id, ...obj.attributes });
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      result[key] = value.map(flattenAttributes);
    } else if (isObject(value)) {
      result[key] = flattenAttributes(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};
