import type { AxiosRequestConfig } from 'axios';

interface SecurityData {
  oauthToken?: string;
  personalAccessToken?: string;
}

export function securityWorker(
  securityData: SecurityData | null,
): Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void {
  if (!securityData) {
    return;
  }

  const headers: AxiosRequestConfig['headers'] = {};
  if (securityData.personalAccessToken) {
    headers['X-Figma-Token'] = securityData.personalAccessToken;
  }
  if (securityData.oauthToken) {
    headers['Authorization'] = `Bearer ${securityData.oauthToken}`;
  }

  return { headers };
}
