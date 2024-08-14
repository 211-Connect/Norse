import axios from 'axios';
import { ExtractAtomValue } from 'jotai';
import { isEmpty, isNil, isString, omitBy } from 'lodash';
import { searchAtom } from '../store/search';
import { API_URL, TENANT_ID } from '../lib/constants';
import { BaseMapAdapter } from '../adapters/map/base-map-adapter';

export class MapService {
  static endpoint = 'location';

  static async forwardGeocode(options: { adapter: BaseMapAdapter }) {}

  static async reverseGeocode(options: { adapter: BaseMapAdapter }) {}
}
