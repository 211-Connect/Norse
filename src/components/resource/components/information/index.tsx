import { useAppConfig } from '@/hooks/use-app-config';
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
import MapboxMap, { Marker } from '@/components/map';
import mapStyle from '@/components/map/style.json';
import { Style } from 'mapbox-gl';
import { getPublicConfig } from '@/pages/api/config';
import { IResource } from '@/types/resource';

type Props = {
  data: IResource;
};

export default function ResourceInformation(props: Props) {
  const appConfig = useAppConfig();
  const MAPBOX_ACCESS_TOKEN = getPublicConfig('MAPBOX_ACCESS_TOKEN');

  return (
    <Card>
      <CardContent className="p-0 pb-2">
        <div
          className="flex w-full h-[500px] max-h-[250px] static rounded-tl-md rounded-tr-md overflow-hidden print:hidden"
          id="map-container"
        >
          <div className="flex w-full h-full">
            <MapboxMap
              accessToken={MAPBOX_ACCESS_TOKEN}
              style={mapStyle as Style}
              center={appConfig?.features?.map?.center}
              zoom={12}
              animate={false}
              boundsPadding={50}
              boundsZoom={13}
            >
              <Marker
                latitude={props.data.location.coordinates[1]}
                longitude={props.data.location.coordinates[0]}
                className="custom-marker"
              />
            </MapboxMap>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="grid grid-cols-2 w-full gap-2">
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
