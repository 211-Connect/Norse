import axios from 'axios';

const createAxios = (tenantId?: string) => {
  const axiosInstance = axios.create({
    params: {
      tenant_id: tenantId,
    },
    headers: {
      'x-tenant-id': tenantId,
    },
  });

  return axiosInstance;
};

export { createAxios };
