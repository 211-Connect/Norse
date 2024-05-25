import appConfig from '../../../.norse/config.json';

export function useAppConfig() {
  return appConfig as any;
}
