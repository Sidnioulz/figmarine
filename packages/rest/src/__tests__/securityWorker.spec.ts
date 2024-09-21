import { securityWorker } from '../securityWorker';

describe('@figmarine/rest - securityWorker', () => {
  it('returns no header when no config was passed', async () => {
    const headers = securityWorker(null);
    expect(headers).toBeUndefined();
  });

  it('returns empty header when an empty config was passed', async () => {
    const headers = securityWorker({});
    expect(headers).toMatchObject({ headers: {} });
  });

  it('returns a X-Figma-Token header when a PAT is used', async () => {
    const value = 'foo';
    const headers = securityWorker({ personalAccessToken: value });
    expect(headers).toMatchObject({ headers: { ['X-Figma-Token']: value } });
  });

  it('returns an OAuth authorization header when an OAuth token is used', async () => {
    const value = 'foo';
    const headers = securityWorker({ oauthToken: value });
    expect(headers).toMatchObject({ headers: { ['Authorization']: `Bearer ${value}` } });
  });
});
