import { StyleType } from '@figmarine/rest';

import type { Cutting } from '../schemas/cutting';
import { JeanneDeClisson } from './users';

export const fileBasic = {
  meta: {
    figmarineVersion: 0,
    label: 'Cutting Fixture',
    lastStored: 12345000,
    lastKnownFilePath: '/a/sunny/spot/for/the/cutting/to/grow/strong.cutting.figmarine.json',
  },
  facets: [
    {
      endpoint: 'GetFile',
      id: 'naoned',
      version: '44',
    },
    {
      endpoint: 'GetFileStyles',
      id: 'naoned',
    },
  ],
  data: {
    components: {},
    componentSets: {},
    files: {
      naoned: {
        name: 'Naoned e Breizh',
        version: '44',
        components: {},
        componentSets: {},
        styles: {},
        lastModified: '851-08-22',
        editorType: 'figma',
        schemaVersion: 1,
        document: {
          type: 'DOCUMENT',
          children: [],
          id: 'whatever',
          name: 'whatever too',
          scrollBehavior: 'FIXED',
        },
      },
    },
    localVariables: {},
    localVariableCollections: {},
    projects: {},
    publishedVariables: {},
    publishedVariableCollections: {},
    styles: {
      '1:1': {
        name: 'Gwer',
        description: 'One of the colours of the Melen-ha-Gwer',
        key: '1:1',
        file_key: 'naoned',
        node_id: '3:4',
        style_type: StyleType.FILL,
        created_at: '851-08-22',
        updated_at: '851-08-22',
        user: JeanneDeClisson,
        sort_position: 'whatever',
      },
      '1:2': {
        name: 'Melen',
        description: 'One of the colours of the Melen-ha-Gwer',
        key: '1:2',
        file_key: 'naoned',
        node_id: '3:4',
        style_type: StyleType.FILL,
        created_at: '851-08-22',
        updated_at: '851-08-22',
        user: JeanneDeClisson,
        sort_position: 'whatever',
      },
    },
  },
} satisfies Cutting;

export const unlabeled = {
  ...fileBasic,
  meta: {
    ...fileBasic.meta,
    label: undefined,
  },
} satisfies Cutting;

export const unstored = {
  ...fileBasic,
  meta: {
    ...fileBasic.meta,
    lastKnownFilePath: undefined,
  },
} satisfies Cutting;

export const unstoredAndUnlabeled = {
  ...fileBasic,
  meta: {
    ...fileBasic.meta,
    label: undefined,
    lastKnownFilePath: undefined,
  },
} satisfies Cutting;
