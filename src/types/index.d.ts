declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_URL?: string;
      INTERNAL_API_KEY?: string;
      NEXT_PUBLIC_WITH_TRAILING_SLASHES?: string;
      NEXT_PUBLIC_CUSTOM_BASE_PATH?: string;

      // Map environment variables
      NEXT_PUBLIC_MAPBOX_API_KEY?: string;
      NEXT_PUBLIC_MAPBOX_STYLE_URL?: string;
      NEXT_PUBLIC_MAPLIBRE_STYLE_URL?: string;

      // Keycloak
      KEYCLOAK_BASE_URL?: string;
      KEYCLOAK_CLIENT_ID?: string;
      KEYCLOAK_INTERNAL_SECRET?: string;
      KEYCLOAK_ADMIN_CLIENT_ID?: string;
      KEYCLOAK_ADMIN_SECRET?: string;

      // Strapi
      STRAPI_URL?: string;
      STRAPI_TOKEN?: string;

      // Payload
      PAYLOAD_APP_CONFIG_API_KEY?: string;
      PAYLOAD_API_ROUTE_SECRET?: string;
      PAYLOAD_SECRET?: string;
      PAYLOAD_SERVER_URL?: string;
      DATABASE_URI?: string;
      MEDIA_S3_BUCKET?: string;
      MEDIA_S3_ACCESS_KEY_ID?: string;
      MEDIA_S3_SECRET_ACCESS_KEY?: string;
      MEDIA_S3_ENDPOINT?: string;
      MEDIA_S3_REGION?: string;
      MEDIA_S3_FORCE_PATH_STYLE?: string;

      // Database pool
      DATABASE_POOL_MIN?: string;
      DATABASE_POOL_MAX?: string;

      // Cache service
      CACHE_REDIS_URI?: string;

      // Translation script
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_USERNAME?: string;
      REDIS_PASSWORD?: string;
      AZURE_TRANSLATE_API_KEY?: string;

      // Translation service (auto-translation feature)
      AZURE_TRANSLATOR_ENDPOINT?: string;
      AZURE_TRANSLATOR_KEY?: string;
      AZURE_TRANSLATOR_REGION?: string;
      GOOGLE_TRANSLATE_CREDENTIALS_BASE64?: string;

      // Alerting
      WEBHOOK_ALERT_URL?: string;

      // Email service
      SENDGRID_API_KEY?: string;

      // Auth
      NEXTAUTH_URL?: string;

      // Analytics (Umami)
      NEXT_PUBLIC_UMAMI_SCRIPT_URL?: string;
      UMAMI_API_URL?: string;
      UMAMI_TEAM_ID?: string;
      UMAMI_USERNAME?: string;
      UMAMI_PASSWORD?: string;

      // EMS
      EMS_SERVICE_URL?: string;

      // Logging
      NEXT_PUBLIC_LOG_LEVEL?: string;

      // These are only used in prebuild/build scripts and are
      // not required to run the application
      PREBUILD_PACKAGE_NAME?: string;
      TRANSLATE_LOCALES?: string;
      GOOGLE_API_KEY?: string;
      NPM_TOKEN?: string;

      // For custom auth host/protocol in proxies
      CUSTOM_AUTH_HOST?: string;
      CUSTOM_AUTH_PROTOCOL?: string;

      // Geospatial filtering feature flag
      NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG?: string;
    }
  }
}
