import { ComponentType } from 'react';
import { ResourceComponentId } from '../types/component-ids';
import { Resource } from '@/types/resource';
import {
  HeaderComponent,
  BadgesComponent,
  ResourceNameComponent,
  ServiceNameComponent,
  AddressComponent,
  TransportationComponent,
  AccessibilityComponent,
  EligibilityComponent,
  RequiredDocumentsComponent,
  HoursComponent,
  PhoneNumbersComponent,
  WebsiteComponent,
  EmailComponent,
  LanguagesComponent,
  InterpretationServicesComponent,
  ApplicationProcessComponent,
  FeesComponent,
  ServiceAreaComponent,
  DescriptionComponent,
  CategoriesComponent,
  LastAssuredComponent,
  AttributionComponent,
  MapComponent,
  GetDirectionsComponent,
  OrganizationComponent,
  FacetsComponent,
  SeparatorComponent,
  CustomAttributeComponent,
} from './resource-components';

export interface ResourceComponentProps {
  resource: Resource;
}

export const componentRegistry: Record<
  ResourceComponentId,
  ComponentType<ResourceComponentProps>
> = {
  [ResourceComponentId.BADGES]: BadgesComponent,
  [ResourceComponentId.RESOURCE_NAME]: ResourceNameComponent,
  [ResourceComponentId.SERVICE_NAME]: ServiceNameComponent,
  [ResourceComponentId.ADDRESS]: AddressComponent,
  [ResourceComponentId.TRANSPORTATION]: TransportationComponent,
  [ResourceComponentId.ACCESSIBILITY]: AccessibilityComponent,
  [ResourceComponentId.ELIGIBILITY]: EligibilityComponent,
  [ResourceComponentId.REQUIRED_DOCUMENTS]: RequiredDocumentsComponent,
  [ResourceComponentId.HOURS]: HoursComponent,
  [ResourceComponentId.PHONE_NUMBERS]: PhoneNumbersComponent,
  [ResourceComponentId.WEBSITE]: WebsiteComponent,
  [ResourceComponentId.EMAIL]: EmailComponent,
  [ResourceComponentId.LANGUAGES]: LanguagesComponent,
  [ResourceComponentId.INTERPRETATION_SERVICES]:
    InterpretationServicesComponent,
  [ResourceComponentId.APPLICATION_PROCESS]: ApplicationProcessComponent,
  [ResourceComponentId.FEES]: FeesComponent,
  [ResourceComponentId.SERVICE_AREA]: ServiceAreaComponent,
  [ResourceComponentId.DESCRIPTION]: DescriptionComponent,
  [ResourceComponentId.CATEGORIES]: CategoriesComponent,
  [ResourceComponentId.LAST_ASSURED]: LastAssuredComponent,
  [ResourceComponentId.ATTRIBUTION]: AttributionComponent,
  [ResourceComponentId.MAP]: MapComponent,
  [ResourceComponentId.GET_DIRECTIONS]: GetDirectionsComponent,
  [ResourceComponentId.ORGANIZATION]: OrganizationComponent,
  [ResourceComponentId.FACETS]: FacetsComponent,
  [ResourceComponentId.SEPARATOR]: SeparatorComponent,
  [ResourceComponentId.CUSTOM_ATTRIBUTE]: CustomAttributeComponent,
};

export function getResourceComponentById(
  componentId: ResourceComponentId,
): ComponentType<ResourceComponentProps> | undefined {
  return componentRegistry[componentId];
}

export function shouldComponentRender(
  componentId: ResourceComponentId,
  resource: Resource,
): boolean {
  switch (componentId) {
    case ResourceComponentId.SEPARATOR:
      return true;
    case ResourceComponentId.BADGES:
      return true;
    case ResourceComponentId.RESOURCE_NAME:
      return Boolean(resource.name);
    case ResourceComponentId.SERVICE_NAME:
      return true;
    case ResourceComponentId.ADDRESS:
      return Boolean(resource.address);
    case ResourceComponentId.TRANSPORTATION:
      return Boolean(resource.transportation);
    case ResourceComponentId.ACCESSIBILITY:
      return Boolean(resource.accessibility);
    case ResourceComponentId.ELIGIBILITY:
      return Boolean(resource.eligibilities);
    case ResourceComponentId.REQUIRED_DOCUMENTS:
      return Boolean(resource.requiredDocuments);
    case ResourceComponentId.HOURS:
      return Boolean(resource.hours);
    case ResourceComponentId.PHONE_NUMBERS:
      return Boolean(resource.phoneNumbers && resource.phoneNumbers.length > 0);
    case ResourceComponentId.WEBSITE:
      return Boolean(resource.website);
    case ResourceComponentId.EMAIL:
      return Boolean(resource.email);
    case ResourceComponentId.LANGUAGES:
      return Boolean(resource.languages && resource.languages.length > 0);
    case ResourceComponentId.INTERPRETATION_SERVICES:
      return Boolean(resource.interpretationServices);
    case ResourceComponentId.APPLICATION_PROCESS:
      return Boolean(resource.applicationProcess);
    case ResourceComponentId.FEES:
      return Boolean(resource.fees);
    case ResourceComponentId.SERVICE_AREA:
      return Boolean(
        resource.serviceAreaDescription || resource.serviceAreaName,
      );
    case ResourceComponentId.DESCRIPTION:
      return Boolean(resource.description);
    case ResourceComponentId.LAST_ASSURED:
      return Boolean(resource.lastAssuredOn);
    case ResourceComponentId.ATTRIBUTION:
      return Boolean(resource.attribution);
    case ResourceComponentId.CATEGORIES:
      return Boolean(resource.categories && resource.categories.length > 0);
    case ResourceComponentId.MAP:
      return Boolean(
        resource.location &&
        resource.location.coordinates &&
        resource.location.coordinates.length === 2,
      );
    case ResourceComponentId.GET_DIRECTIONS:
      return Boolean(
        resource.location &&
        resource.location.coordinates &&
        resource.location.coordinates.length === 2,
      );
    case ResourceComponentId.FACETS:
      return true;
    case ResourceComponentId.ORGANIZATION:
      return Boolean(
        resource.organizationName || resource.organizationDescription,
      );
    case ResourceComponentId.CUSTOM_ATTRIBUTE:
      return true; // Custom attribute component handles its own conditional rendering
    default:
      return true;
  }
}
