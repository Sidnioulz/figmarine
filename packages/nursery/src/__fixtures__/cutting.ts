import type { Cutting } from '@figmarine/cuttings';

/**
 * A minimal but schema-valid cutting, as `take` would produce for the
 * primary Figmarine test file.
 */
export const debugFileCutting = {
  meta: {
    figmarineVersion: 0,
    label: 'debug file',
    lastStored: 0,
    lastKnownFilePath: undefined,
  },
  facets: [
    { endpoint: 'GetFile', id: 'idLa6ZCXDJUeRFI5wLVNWN', lastHydrated: 1751791000000 },
    { endpoint: 'GetFileStyles', id: 'idLa6ZCXDJUeRFI5wLVNWN', lastHydrated: 1751791000000 },
  ],
  data: {
    components: {},
    componentSets: {},
    files: {
      idLa6ZCXDJUeRFI5wLVNWN: {
        name: "Steve's Figma API debug file",
        version: '1',
        components: {},
        componentSets: {},
        styles: {},
        lastModified: '2026-07-01',
        editorType: 'figma',
        schemaVersion: 1,
        document: {
          type: 'DOCUMENT',
          children: [],
          id: '0:0',
          name: 'Document',
          scrollBehavior: 'FIXED',
        },
      },
    },
    localVariables: {},
    localVariableCollections: {},
    projects: {},
    publishedVariables: {},
    publishedVariableCollections: {},
    styles: {},
  },
} satisfies Cutting;

/**
 * A nursery config matching {@link debugFileCutting}.
 */
export const debugFileConfig = {
  cuttings: {
    'debug-file': {
      label: 'debug file',
      files: [
        {
          url: 'https://www.figma.com/design/idLa6ZCXDJUeRFI5wLVNWN/Steve-s-Figma-API-debug-file',
          endpoints: ['GetFile', 'GetFileStyles'] as ['GetFile', 'GetFileStyles'],
        },
      ],
    },
  },
};
