import { Overview } from '../components/overview';
import { Information } from '../components/information';
import { OrganizationInformation } from '../components/organization-information';
import { AdditionalInformation } from '../components/additional-information';
import { ResourceLayout } from './resource-layout';
import { Resource } from '@/types/resource';

type ResourceTemplateProps = {
  resource: Resource | null;
  prevSearch: string | undefined;
};

export function ResourceTemplate({
  resource,
  prevSearch,
}: ResourceTemplateProps) {
  if (!resource) {
    // Handle the case where resource is null or undefined.
    return (
      <div>
        <h1>Resource not found</h1>
      </div>
    );
  }

  return (
    <ResourceLayout resource={resource} prevSearch={prevSearch}>
      <Overview resource={resource} />

      <div className="flex flex-1 flex-col gap-2">
        <Information resource={resource} />
        <AdditionalInformation resource={resource} />
        <OrganizationInformation resource={resource} />
      </div>
    </ResourceLayout>
  );
}
