import path from 'node:path';
import process from 'node:process';

import { constants, generateApi } from 'swagger-typescript-api';

const openApiUrl =
  process.env.API_OPENAPI_URL ?? 'http://localhost:8080/swagger/json';

await generateApi({
  url: openApiUrl,
  output: path.resolve(process.cwd(), 'src/lib/api/generated'),
  fileName: 'norse-api.ts',
  cleanOutput: true,
  modular: true,
  moduleNameFirstTag: true,
  extractRequestParams: true,
  extractRequestBody: true,
  extractResponseBody: true,
  extractResponseError: true,
  enumStyle: 'union',
  defaultResponseAsSuccess: true,
  httpClientType: constants.HTTP_CLIENT.FETCH,
  silent: true,
});
