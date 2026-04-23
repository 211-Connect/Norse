import { ComponentType } from 'react';
import { SearchCardComponentId } from '../types/card-component-ids';
import { ResultType } from '@/app/(app)/shared/store/results';
import {
  BadgesComponent,
  ResourceNameComponent,
  ServiceNameComponent,
  LocationNameComponent,
  LocationNameSubtitleComponent,
  AddressComponent,
  PhoneComponent,
  WebsiteComponent,
  DescriptionComponent,
  CategoriesComponent,
  ActionButtonsComponent,
  SearchCardComponentProps,
  CustomAttributeComponent,
} from './search-card-components';
import { SeparatorComponent } from '../../resource/components/resource-components';
import { AppConfig } from '@/types/appConfig';
import { getBadgesForResource } from '@/utils/getBadgesForResource';
import { AttributionComponent } from './search-card-components/attribution';

export const searchCardComponentRegistry: Record<
  SearchCardComponentId,
  ComponentType<SearchCardComponentProps>
> = {
  [SearchCardComponentId.ATTRIBUTION]: AttributionComponent,
  [SearchCardComponentId.BADGES]: BadgesComponent,
  [SearchCardComponentId.RESOURCE_NAME]: ResourceNameComponent,
  [SearchCardComponentId.SERVICE_NAME]: ServiceNameComponent,
  [SearchCardComponentId.LOCATION_NAME]: LocationNameComponent,
  [SearchCardComponentId.LOCATION_NAME_SUBTITLE]: LocationNameSubtitleComponent,
  [SearchCardComponentId.ADDRESS]: AddressComponent,
  [SearchCardComponentId.PHONE]: PhoneComponent,
  [SearchCardComponentId.WEBSITE]: WebsiteComponent,
  [SearchCardComponentId.DESCRIPTION]: DescriptionComponent,
  [SearchCardComponentId.CATEGORIES]: CategoriesComponent,
  [SearchCardComponentId.ACTION_BUTTONS]: ActionButtonsComponent,
  [SearchCardComponentId.SEPARATOR]: SeparatorComponent,
  [SearchCardComponentId.CUSTOM_ATTRIBUTE]: CustomAttributeComponent,
};

export function getSearchCardComponentById(
  componentId: SearchCardComponentId | string,
): ComponentType<SearchCardComponentProps> | undefined {
  const component = searchCardComponentRegistry[componentId];
  if (!component) {
    console.warn(
      `Search card component with ID "${componentId}" not found in registry.`,
    );
  }

  return component;
}

export function shouldSearchCardComponentRender(
  componentId: SearchCardComponentId | string,
  result: ResultType,
  appConfig: AppConfig,
): boolean {
  switch (componentId) {
    case SearchCardComponentId.SEPARATOR:
      return true;
    case SearchCardComponentId.BADGES:
      const badges = getBadgesForResource(
        appConfig.badges,
        result.facets,
        result.taxonomies,
      );
      const showComponent = badges.length > 0 || result.priority === 1;

      return showComponent;
    case SearchCardComponentId.ADDRESS:
      return true; // Component handles unavailable addresses
    case SearchCardComponentId.RESOURCE_NAME:
      return Boolean(result.name);
    case SearchCardComponentId.SERVICE_NAME:
      return Boolean(result.serviceName);
    case SearchCardComponentId.LOCATION_NAME:
      return Boolean(result.locationName);
    case SearchCardComponentId.LOCATION_NAME_SUBTITLE:
      return Boolean(result.locationName);
    case SearchCardComponentId.PHONE:
      return Boolean(result.phone);
    case SearchCardComponentId.WEBSITE:
      return Boolean(result.website);
    case SearchCardComponentId.DESCRIPTION:
      return Boolean(result.summary || result.description);
    case SearchCardComponentId.CATEGORIES:
      return Boolean(result.taxonomies && result.taxonomies.length > 0);
    case SearchCardComponentId.ACTION_BUTTONS:
      return true;
    case SearchCardComponentId.CUSTOM_ATTRIBUTE:
      return true; // Component itself handles its own rendering
    default:
      return true;
  }
}
