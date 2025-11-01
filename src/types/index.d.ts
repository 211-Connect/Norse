declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL?: string;
      WITH_TRAILING_SLASHES?: string;
      CUSTOM_BASE_PATH?: string;

      // Map environment variables
      NEXT_PUBLIC_MAPBOX_API_KEY?: string;
      NEXT_PUBLIC_MAPBOX_STYLE_URL?: string;
      NEXT_PUBLIC_MAPLIBRE_STYLE_URL?: string;

      // Required Keycloak environment variables
      KEYCLOAK_CLIENT_ID?: string;

      // Strapi
      STRAPI_URL?: string;
      STRAPI_TOKEN?: string;

      // Payload
      PAYLOAD_API_ROUTE_SECRET?: string;
      PAYLOAD_SECRET?: string;
      DATABASE_URI?: string;
      MEDIA_S3_BUCKET?: string;
      MEDIA_S3_ACCESS_KEY_ID?: string;
      MEDIA_S3_SECRET_ACCESS_KEY?: string;
      MEDIA_S3_ENDPOINT?: string;
      MEDIA_S3_REGION?: string;
      MEDIA_S3_FORCE_PATH_STYLE?: string;

      // Translation script
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_USERNAME?: string;
      REDIS_PASSWORD?: string;
      AZURE_TRANSLATE_API_KEY?: string;

      // Alerting
      WEBHOOK_ALERT_URL?: string;

      // These are only used in prebuild/build scripts and are
      // not required to run the application
      PREBUILD_PACKAGE_NAME?: string;
      TRANSLATE_LOCALES?: string;
      GOOGLE_API_KEY?: string;
      NPM_TOKEN?: string;
    }
  }
}
