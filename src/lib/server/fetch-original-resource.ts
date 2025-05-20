import { apiFetch } from './api-fetch';
import { transformResource } from '../../utils/transform-resource';

export async function fetchOriginalResource(originalId: string) {
  const response = await apiFetch(`/resource/original/${originalId}`);

  if (!response.ok) {
    return { data: null, error: 'Unable to get resource by id' };
  }

  const data = await response.json();

  return { data: transformResource(data), error: null };
}
