import {
  type PublishedComponent,
  type PublishedComponentSet,
  type PublishedStyle,
  StyleType,
} from '@figmarine/rest';

import { JeanneDeClisson } from './users';

/**
 * Published-library API payloads. None of the recorded fixture files
 * publish components or styles to a team library (their published
 * endpoints genuinely return empty arrays, which the recorded fixtures
 * cover), so these spec-typed objects reuse real keys, node ids and names
 * from the Figma API debug file's in-file component metadata to exercise
 * the non-empty code paths.
 */
export const publishedComponents = [
  {
    key: '7f5fcca03633bd9e98bb6ad5ec635c2dfdda4dc1',
    file_key: 'idLa6ZCXDJUeRFI5wLVNWN',
    node_id: '2:15696',
    name: 'Type=Stock examples',
    description: '',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    user: JeanneDeClisson,
  },
  {
    key: '5015052a4cb0e58c318f13bbd54f9e2e4a48d4b6',
    file_key: 'idLa6ZCXDJUeRFI5wLVNWN',
    node_id: '2:15697',
    name: 'Type=Custom examples',
    description: '',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    user: JeanneDeClisson,
  },
] satisfies PublishedComponent[];

export const publishedComponentSets = [
  {
    key: '92018a5b8b4e63b7d95d0b9b46e5d43f0e6b8d4e',
    file_key: 'idLa6ZCXDJUeRFI5wLVNWN',
    node_id: '2:15695',
    name: 'Examples',
    description: '',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    user: JeanneDeClisson,
  },
] satisfies PublishedComponentSet[];

export const publishedStyles = [
  {
    key: 'e63db614830d17229fc655efb6b0c9fb66c08eb3',
    file_key: 'idLa6ZCXDJUeRFI5wLVNWN',
    node_id: '2:22631',
    style_type: StyleType.EFFECT,
    name: 'Popover',
    description: '',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    user: JeanneDeClisson,
    sort_position: 'a',
  },
] satisfies PublishedStyle[];
