import { AxiosHeaders } from 'axios';

export const fileRequest = {
  method: 'GET',
  path: '/v1/files/eEzsMbC707n4RQ4QCsuUEm',
  host: 'api.figma.com',
  protocol: 'https:',
  headers: new AxiosHeaders({
    Accept: 'application/json, text/plain, */*',
    'X-Figma-Token': 'CENSORED',
    'User-Agent': 'axios/1.7.7',
    'Accept-Encoding': 'gzip, compress, deflate, br',
  }),
};
