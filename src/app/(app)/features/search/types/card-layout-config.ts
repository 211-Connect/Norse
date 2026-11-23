import { AppConfig } from '@/types/appConfig';

import { SearchCardComponentId } from './card-component-ids';

export type SearchCardLayoutConfig = NonNullable<
  AppConfig['search']['cardLayout']
>;
export type SearchCardLayoutItem = SearchCardLayoutConfig[number];
export type SearchCardCustomAttributeConfig = NonNullable<
  SearchCardLayoutItem['customAttribute']
>;

export const DEFAULT_SEARCH_CARD_LAYOUT: SearchCardLayoutConfig = [
  { componentId: SearchCardComponentId.BADGES },
  { componentId: SearchCardComponentId.RESOURCE_NAME },
  { componentId: SearchCardComponentId.SERVICE_NAME },
  { componentId: SearchCardComponentId.ADDRESS },
  { componentId: SearchCardComponentId.PHONE },
  { componentId: SearchCardComponentId.WEBSITE },
  { componentId: SearchCardComponentId.DESCRIPTION },
  { componentId: SearchCardComponentId.CATEGORIES },
  { componentId: SearchCardComponentId.SEPARATOR },
  { componentId: SearchCardComponentId.ACTION_BUTTONS },
];

/**
 * The default card layout of a tenant with the v2 switch on (`enableV2Api`). Lucas 2026-11-16:
 * "What's Here" is what people look for, so it comes right below the name. v1 tenants keep the
 * order of DEFAULT_SEARCH_CARD_LAYOUT.
 */
export const V2_DEFAULT_SEARCH_CARD_LAYOUT: SearchCardLayoutConfig = [
  { componentId: SearchCardComponentId.BADGES },
  { componentId: SearchCardComponentId.RESOURCE_NAME },
  { componentId: SearchCardComponentId.SERVICE_NAME },
  // Lucas 2026-11-16: "What's Here" is what people look for, so it comes right below the name.
  { componentId: SearchCardComponentId.CATEGORIES },
  { componentId: SearchCardComponentId.ADDRESS },
  { componentId: SearchCardComponentId.PHONE },
  { componentId: SearchCardComponentId.WEBSITE },
  { componentId: SearchCardComponentId.DESCRIPTION },
  { componentId: SearchCardComponentId.SEPARATOR },
  { componentId: SearchCardComponentId.ACTION_BUTTONS },
];
