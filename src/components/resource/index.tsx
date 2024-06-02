import { useRef } from 'react';
import { ResourceNavigation } from './components/navigation';
import ResourceInformation from './components/information';
import { ResourceOverview } from './components/overview';
import { ResourceOrganization } from './components/organization';
import { IResource } from '@/types/resource';

export default function Resource({ data }: { data: IResource }) {
  const componentRef = useRef();

  return (
    <div className="flex-1 flex flex-col gap-2 pb-2 pt-2" ref={componentRef}>
      <ResourceNavigation
        resourceId={data.id}
        displayName={data.name}
        serviceDescription={data.description}
        componentToPrint={componentRef}
      />

      <div className="flex flex-col md:flex-row w-full h-full max-w-[1100px] mx-auto gap-2 print:flex-col">
        <div className="flex flex-col gap-2 w-full md:max-w-[50%]">
          <ResourceOverview data={data} />
        </div>

        <div className="flex flex-col h-full w-full md:max-w-[50%] gap-2">
          <ResourceInformation data={data} />
          <ResourceOrganization data={data} />
        </div>
      </div>
    </div>
  );
}
