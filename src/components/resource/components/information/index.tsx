import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Addresses from './addresses';
import PhoneNumbers from './phone-numbers';
import EmailAddress from './email-address';
import Website from './website';
import Hours from './hours';
import ApplicationProcess from './application-process';
import RequiredDocuments from './required-documents';
import Eligibility from './eligibility';
import Fees from './fees';
import Languages from './languages';
import ServiceArea from './service-area';
import { IResource } from '@/types/resource';
import MapLoader from '@/components/map';

type Props = {
  data: IResource;
};

export default function ResourceInformation(props: Props) {
  return (
    <Card>
      <CardContent className="p-0 pb-2">
        <div
          className="static flex h-[500px] max-h-[250px] w-full overflow-hidden rounded-tl-md rounded-tr-md print:hidden"
          id="map-container"
        >
          <div className="flex h-full w-full">
            <MapLoader
              zoom={12}
              marker={{ zoom: 12 }}
              boundsPadding={50}
              boundsZoom={13}
              results={[
                { id: props.data.id, location: { point: props.data.location } },
              ]}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="break-words p-4 pt-0">
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <Addresses data={props.data} />
          <PhoneNumbers data={props.data} />
          <EmailAddress data={props.data} />
          <Website data={props.data} />
          <Hours data={props.data} />
          <ApplicationProcess data={props.data} />
          <RequiredDocuments data={props.data} />
          <Eligibility data={props.data} />
          <Fees data={props.data} />
          <Languages data={props.data} />
          <ServiceArea data={props.data} />
        </div>
      </CardFooter>
    </Card>
  );
}
