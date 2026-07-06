import type { ClientInterface } from '@figmarine/rest';
import { vi } from 'vitest';

import { API_FIXTURE_FILES, loadApiFixture } from './api';

/**
 * Wraps recorded response data in the shape of an Axios success response.
 * @param data The response body.
 * @returns An object that quacks like an `AxiosResponse`.
 */
export function mockResponse<T>(data: T) {
  return { status: 200, statusText: 'OK', data };
}

/**
 * Builds a `@figmarine/rest` client mocked with the recorded API fixtures
 * of one of the fixture files, for tests that exercise cutting-taking
 * without a network.
 * @param label The fixture file whose recorded responses to serve.
 * @returns A mocked client.
 */
export function makeMockedClient(
  label: keyof typeof API_FIXTURE_FILES = 'figma-api-debug-file',
): ClientInterface {
  return {
    v1: {
      getFile: vi.fn(async () => mockResponse(loadApiFixture(label, 'GetFile'))),
      getFileComponents: vi.fn(async () =>
        mockResponse(loadApiFixture(label, 'GetFileComponents')),
      ),
      getFileComponentSets: vi.fn(async () =>
        mockResponse(loadApiFixture(label, 'GetFileComponentSets')),
      ),
      getFileStyles: vi.fn(async () => mockResponse(loadApiFixture(label, 'GetFileStyles'))),
    },
  } as unknown as ClientInterface;
}
