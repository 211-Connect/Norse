declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_MAPBOX_API_KEY?: string;
      NEXT_PUBLIC_GTM_CONTAINER_ID?: string;

      // Required Twilio environment variables (ONLY IF USING TWILIO FOR SMS SHARING)
      TWILIO_PHONE_NUMBER?: string;
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;

      // Required Next Auth environment variables
      NEXTAUTH_URL?: string;
      NEXTAUTH_SECRET?: string;

      // Required Keycloak environment variables
      KEYCLOAK_SECRET?: string;
      KEYCLOAK_ISSUER?: string;
      KEYCLOAK_CLIENT_ID?: string;
      NEXT_PUBLIC_KEYCLOAK_REALM?: string;
    }
  }
}
