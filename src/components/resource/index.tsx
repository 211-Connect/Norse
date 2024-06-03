import { useRef } from 'react';
import { ResourceNavigation } from './components/navigation';
import ResourceInformation from './components/information';
import { ResourceOverview } from './components/overview';
import { ResourceOrganization } from './components/organization';
import { IResource } from '@/types/resource';

export default function Resource({ data }: { data: IResource }) {
  const componentRef = useRef();

  return (
    <div className="flex flex-1 flex-col gap-2 pb-2 pt-2" ref={componentRef}>
      <ResourceNavigation
        resourceId={data.id}
        displayName={data.name}
        serviceDescription={data.description}
        componentToPrint={componentRef}
      />

      <div className="container mx-auto flex h-full w-full flex-col gap-2 md:flex-row print:flex-col">
        <div className="flex w-full flex-col gap-2 md:max-w-[50%]">
          <ResourceOverview data={data} />
        </div>

        <div className="flex h-full w-full flex-col gap-2 md:max-w-[50%]">
          <ResourceInformation data={data} />
          <ResourceOrganization data={data} />
        </div>
      </div>
    </div>
  );
}
