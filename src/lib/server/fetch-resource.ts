import { apiFetch } from './api-fetch';
import { transformResource } from '../../utils/transform-resource';

export async function fetchResource(id: string) {
  const response = await apiFetch(`/resource/${id}`);

  if (!response.ok) {
    return { data: null, error: 'Unable to get resource by id' };
  }

  const data = await response.json();

  return { data: transformResource(data), error: null };
}
