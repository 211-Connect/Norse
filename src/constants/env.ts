import getConfig from 'next/config';
const { publicRuntimeConfig: c } = getConfig();

export const NEXT_PUBLIC_MAPBOX_API_KEY = c.NEXT_PUBLIC_MAPBOX_API_KEY;
export const NEXT_PUBLIC_GTM_CONTAINER_ID = c.NEXT_PUBLIC_GTM_CONTAINER_ID;
export const NEXT_PUBLIC_KEYCLOAK_REALM = c.NEXT_PUBLIC_KEYCLOAK_REALM;
export const NEXT_PUBLIC_HELLO_WORLD = c.NEXT_PUBLIC_HELLO_WORLD;
