import axiosAuth from '../../lib/axios';
import { AxiosInstance } from 'axios';
import { TFunction, i18n } from 'next-i18next';
import router from 'next/router';

export class BaseAdapter {
  protected axios: AxiosInstance = axiosAuth;
  protected t: TFunction | undefined;

  constructor(axios?: AxiosInstance) {
    if (typeof window !== 'undefined') {
      this.t = i18n?.getFixedT(router?.locale ?? router?.defaultLocale ?? 'en');
    }

    if (axios) {
      this.axios = axios;
    }
  }

  public setAxiosInstance(axios: AxiosInstance) {
    this.axios = axios;
  }
}
