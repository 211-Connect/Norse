import { get } from 'radash';
import { Resource } from '@/types/resource';

export function interpolateResourceProperties(
  template: string | null | undefined,
  resource: Resource,
): string {
  if (!template) return '';

  // Match {{ propertyPath }} where propertyPath can contain dots, underscores, letters, and numbers
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, propertyPath) => {
    const value = get(resource, propertyPath.trim());

    // Convert value to string, or keep the placeholder if value is null/undefined
    return value !== undefined && value !== null ? String(value) : match;
  });
}
