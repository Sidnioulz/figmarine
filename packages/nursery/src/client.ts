import { Client, type ClientInterface } from '@figmarine/rest';

/**
 * A function that creates the REST client used to fetch cuttings.
 * Injectable so that commands can be tested without network access.
 */
export type ClientFactory = () => Promise<ClientInterface>;

/**
 * Creates the default nursery REST client. Authentication comes from the
 * FIGMA_PERSONAL_ACCESS_TOKEN or FIGMA_OAUTH_TOKEN environment variables;
 * the nursery never stores tokens in config files.
 */
export const defaultClientFactory: ClientFactory = async () =>
  Client({
    // The nursery runs in CI and writes its own snapshots: the rest
    // package's development disk cache would only get in the way.
    cache: false,
    mode: 'production',
    rateLimit: true,
  });
