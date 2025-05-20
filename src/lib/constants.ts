export const { STRAPI_URL, STRAPI_TOKEN } = process.env;

export const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const TENANT_ID = process.env.TENANT_ID;
export const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
export const MAPBOX_API_BASE_URL = 'https://api.mapbox.com';
export const MAPBOX_STYLE_URL = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL;
export const MAPLIBRE_STYLE_URL = process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL;

export const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

export const COOKIE_SESSION_ID = '_norse_session_id';
export const COOKIE_TENANT_ID = '_norse_tenant_id';

// Strictly necessary cookies
export const ALLOW_ALL_COOKIES = 'allow-all-cookies'; // required to be able to store user preferences
export const PREV_SEARCH = '_norse_prev_search';

// User preferences
export const USER_PREF_LAYOUT = 'user-pref-layout';
export const USER_PREF_LOCATION = '_norse_user_pref_location';
export const USER_PREF_COORDS = '_norse_user_pref_coordinates';
export const USER_PREF_THEME = 'user-pref-theme';
export const USER_PREF_DISTANCE = 'user-pref-distance';

export const HEADER_ID = 'app-header';
