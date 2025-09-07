import axios from 'axios';
import { TENANT_ID } from './constants';

const Axios = axios.create({
  params: {
    tenant_id: TENANT_ID,
  },
  headers: {
    'x-tenant-id': TENANT_ID,
  },
});

export { Axios };
