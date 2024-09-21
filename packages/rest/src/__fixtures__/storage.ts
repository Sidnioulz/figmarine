import type { NotEmptyStorageValue } from 'axios-cache-interceptor';

export const Basic200 = {
  data: {
    data: 'Basic data',
    headers: {},
    status: 200,
    statusText: 'OK',
  },
  createdAt: Date.now(),
  ttl: 1000,
  state: 'cached',
} satisfies NotEmptyStorageValue;

export const Alternative200 = {
  data: {
    data: 'Alternative data',
    headers: {},
    status: 200,
    statusText: 'OK',
  },
  createdAt: Date.now(),
  ttl: 1000,
  state: 'cached',
} satisfies NotEmptyStorageValue;
