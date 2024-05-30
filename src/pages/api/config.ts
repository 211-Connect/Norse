/**
 * This endpoint allows us to include "self-hosted" runtime environment variables
 * for the client application
 * @see https://gist.github.com/jihchi/bbc718366fbb6342e0a48045f18c82e5
 */
const config = {
  MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  KEYCLOAK_REALM: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
  GTM_CONTAINER_ID: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID,
};

// properly access public runtime configuration on both client-side and server-side
export const getPublicConfig = (name: keyof typeof config) =>
  typeof window === 'undefined' ? config[name] : window.PUBLIC_CONFIG[name];

export default function handler(req, res) {
  res.status(200).send(`window.PUBLIC_CONFIG = ${JSON.stringify(config)}`);
}
