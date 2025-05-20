export interface Resource {
  id: string;
  serviceName: string | null;
  attribution: string | null;
  name: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  addresses: any[] | null;
  phoneNumbers: any[] | null;
  email: string | null;
  hours: string | null;
  languages: any[] | null;
  applicationProcess: string | null;
  fees: string | null;
  requiredDocuments: any[] | null;
  eligibilities: string | null;
  serviceAreaDescription: string | null;
  serviceAreaName: string | null;
  categories: any[] | null;
  lastAssuredOn: string;
  location: {
    coordinates: [number, number];
  };
  organizationName: string | null;
  organizationDescription: string | null;
  serviceArea: string | null;
}
