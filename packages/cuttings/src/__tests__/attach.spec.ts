import { test as base, type Mock } from 'vitest';
import { Client, type ClientInterface, type V1 } from '@figmarine/rest';
import type { AxiosAdapter } from 'axios';

import { API_FIXTURE_FILES, loadApiFixture } from '../__fixtures__/api';
import { attachCuttings, CUTTING_SOURCE_HEADER } from '../attach';
import { makeMockedClient, mockResponse } from '../__fixtures__/mockedClient';
import type { Cutting } from '../schemas/cutting';
import { publishedComponents } from '../__fixtures__/published';
import { slimFile } from '../slim';
import { take } from '../take';

/* Logger mock. */
const { mockedLog } = vi.hoisted(() => ({ mockedLog: vi.fn() }));
vi.mock(import('@figmarine/logger'), async () => ({ log: mockedLog }));

const FILE_KEY = API_FIXTURE_FILES['figma-api-debug-file'];
const OTHER_FILE_KEY = API_FIXTURE_FILES['error-states'];
const rawFile = loadApiFixture<V1.GetFile.ResponseBody>('figma-api-debug-file', 'GetFile');

/* Test fixtures: cuttings built from recorded API data, and a real REST
 * client whose network adapter is replaced by a spy so that no test ever
 * leaves the process. */
interface AttachFixtures {
  cutting: Cutting;
  client: ClientInterface;
  networkAdapter: Mock<AxiosAdapter>;
}

const it = base.extend<AttachFixtures>({
  cutting: async ({}, use) => {
    const mocked = makeMockedClient();
    vi.mocked(mocked.v1.getFileComponents).mockResolvedValueOnce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockResponse({ meta: { components: publishedComponents } }) as any,
    );
    const cutting = await take({
      client: mocked,
      facets: [
        { endpoint: 'GetFile', id: FILE_KEY },
        { endpoint: 'GetFileComponents', id: FILE_KEY },
        { endpoint: 'GetFileComponentSets', id: FILE_KEY },
        { endpoint: 'GetFileStyles', id: FILE_KEY },
      ],
      label: 'debug file',
    });
    await use(cutting);
  },
  networkAdapter: async ({}, use) => {
    await use(
      vi.fn<AxiosAdapter>(async (config) => ({
        data: { reached: 'network' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })),
    );
  },
  client: async ({ networkAdapter }, use) => {
    const client = await Client({
      personalAccessToken: 'test-token',
      mode: 'production',
      cache: false,
      rateLimit: false,
    });
    client.instance.defaults.adapter = networkAdapter;
    await use(client);
  },
});

describe('@figmarine/cuttings - attach', () => {
  describe('GetFile', () => {
    it('serves a compatible GetFile call from the cutting without touching the network', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile(FILE_KEY);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual(slimFile(rawFile));
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('marks served responses with the cutting source header', async ({ client, cutting }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile(FILE_KEY);

      expect(response.headers[CUTTING_SOURCE_HEADER]).toBe(encodeURIComponent('debug file'));
    });

    it('names unlabeled cuttings in the source header', async ({ client, cutting }) => {
      attachCuttings(client, [{ ...cutting, meta: { ...cutting.meta, label: undefined } }]);

      const response = await client.v1.getFile(FILE_KEY);

      expect(response.headers[CUTTING_SOURCE_HEADER]).toBe('cutting');
    });

    it('serves calls that ask for branch data', async ({ client, cutting, networkAdapter }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile(FILE_KEY, { branch_data: true });

      expect(response.data).toStrictEqual(slimFile(rawFile));
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('serves calls that ask for the exact version held in the cutting', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile(FILE_KEY, { version: rawFile.version });

      expect(response.data).toStrictEqual(slimFile(rawFile));
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('serves version-pinned facets when the call asks for the pinned version', async ({
      client,
      networkAdapter,
    }) => {
      const mocked = makeMockedClient();
      const pinned = await take({
        client: mocked,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY, version: '12345' }],
      });
      attachCuttings(client, [pinned]);

      const response = await client.v1.getFile(FILE_KEY, { version: '12345' });

      expect(response.status).toBe(200);
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('goes to the network when the call asks for another version', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile(FILE_KEY, { version: 'some-other-version' });

      expect(response.data).toStrictEqual({ reached: 'network' });
      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });

    it('goes to the network when the cutting is pinned but the call is not', async ({
      client,
      networkAdapter,
    }) => {
      const mocked = makeMockedClient();
      const pinned = await take({
        client: mocked,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY, version: '12345' }],
      });
      // The recorded fixture reports its own version; a pinned facet only
      // matches calls that ask for the pin (or the recorded version).
      attachCuttings(client, [
        {
          ...pinned,
          data: {
            ...pinned.data,
            files: {
              [FILE_KEY]: { ...pinned.data.files[FILE_KEY], version: '12345' },
            },
          },
        },
      ]);

      const response = await client.v1.getFile(FILE_KEY);

      expect(response.data).toStrictEqual({ reached: 'network' });
      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });

    it('goes to the network when the call uses params the cutting cannot honour', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      await client.v1.getFile(FILE_KEY, { depth: 1 });
      await client.v1.getFile(FILE_KEY, { ids: '1:2' });
      await client.v1.getFile(FILE_KEY, { geometry: 'paths' });
      await client.v1.getFile(FILE_KEY, { plugin_data: 'shared' });

      expect(networkAdapter).toHaveBeenCalledTimes(4);
    });

    it('goes to the network for files the cutting does not hold', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFile('someOtherFileKey1234');

      expect(response.data).toStrictEqual({ reached: 'network' });
      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('published item endpoints', () => {
    it('rebuilds GetFileComponents responses from the cutting', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFileComponents(FILE_KEY);

      expect(response.status).toBe(200);
      expect(response.data.error).toBe(false);
      expect(response.data.meta.components).toHaveLength(publishedComponents.length);
      expect(response.data.meta.components.map((c) => c.key).sort()).toStrictEqual(
        publishedComponents.map((c) => c.key).sort(),
      );
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('only serves published items that belong to the requested file', async ({
      client,
      cutting,
    }) => {
      const foreignComponent = {
        ...publishedComponents[0],
        key: 'foreignComponentKey',
        file_key: 'someOtherFileKey1234',
      };
      const polluted = structuredClone(cutting);
      polluted.data.components[foreignComponent.key] = foreignComponent;
      // Pretend the other file's components are also snapshotted.
      polluted.facets.push({
        endpoint: 'GetFileComponents',
        id: 'someOtherFileKey1234',
        lastHydrated: 1,
      });
      attachCuttings(client, [polluted]);

      const response = await client.v1.getFileComponents(FILE_KEY);

      expect(response.data.meta.components.map((c) => c.key)).not.toContain('foreignComponentKey');
    });

    it('serves an empty list for files that publish nothing', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      // The recorded fixtures publish no component sets: the facet is
      // hydrated but its data dictionary holds nothing for this file.
      const response = await client.v1.getFileComponentSets(FILE_KEY);

      expect(response.status).toBe(200);
      expect(response.data.meta.component_sets).toStrictEqual([]);
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('rebuilds GetFileStyles responses from the cutting', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      const response = await client.v1.getFileStyles(FILE_KEY);

      expect(response.status).toBe(200);
      expect(response.data.meta.styles).toStrictEqual(Object.values(cutting.data.styles));
      expect(networkAdapter).not.toHaveBeenCalled();
    });

    it('goes to the network when the facet was never snapshotted', async ({
      client,
      networkAdapter,
    }) => {
      const mocked = makeMockedClient();
      const fileOnly = await take({
        client: mocked,
        facets: [{ endpoint: 'GetFile', id: FILE_KEY }],
      });
      attachCuttings(client, [fileOnly]);

      const response = await client.v1.getFileComponents(FILE_KEY);

      expect(response.data).toStrictEqual({ reached: 'network' });
      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('several cuttings', () => {
    it('finds data across all attached cuttings', async ({ client, cutting, networkAdapter }) => {
      const mocked = makeMockedClient('error-states');
      const other = await take({
        client: mocked,
        facets: [{ endpoint: 'GetFile', id: OTHER_FILE_KEY }],
        label: 'error states',
      });
      attachCuttings(client, [cutting, other]);

      const first = await client.v1.getFile(FILE_KEY);
      const second = await client.v1.getFile(OTHER_FILE_KEY);

      expect(first.headers[CUTTING_SOURCE_HEADER]).toBe(encodeURIComponent('debug file'));
      expect(second.headers[CUTTING_SOURCE_HEADER]).toBe(encodeURIComponent('error states'));
      expect(networkAdapter).not.toHaveBeenCalled();
    });
  });

  describe('pass-through', () => {
    it('ignores non-GET calls on matching URLs', async ({ client, cutting, networkAdapter }) => {
      attachCuttings(client, [cutting]);

      await client.instance.post(`/v1/files/${FILE_KEY}`);

      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });

    it('ignores endpoints that cuttings do not snapshot', async ({
      client,
      cutting,
      networkAdapter,
    }) => {
      attachCuttings(client, [cutting]);

      await client.instance.get(`/v1/files/${FILE_KEY}/versions`);
      await client.instance.get(`/v1/files/${FILE_KEY}/nodes`, { params: { ids: '1:2' } });
      await client.instance.get(`/v1/me`);

      expect(networkAdapter).toHaveBeenCalledTimes(3);
    });

    it('stops serving once detached', async ({ client, cutting, networkAdapter }) => {
      const detach = attachCuttings(client, [cutting]);

      const before = await client.v1.getFile(FILE_KEY);
      detach();
      const after = await client.v1.getFile(FILE_KEY);

      expect(before.data).toStrictEqual(slimFile(rawFile));
      expect(after.data).toStrictEqual({ reached: 'network' });
      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });

    it('serves nothing when attached with no cuttings', async ({ client, networkAdapter }) => {
      attachCuttings(client, []);

      await client.v1.getFile(FILE_KEY);

      expect(networkAdapter).toHaveBeenCalledTimes(1);
    });
  });
});
