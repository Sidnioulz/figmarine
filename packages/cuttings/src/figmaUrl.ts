import { log } from '@figmarine/logger';

/**
 * A reference to a Figma file, extracted from a URL to that file.
 */
export interface FigmaFileRef {
  /**
   * The key to pass to file-scoped REST API endpoints. When the URL points
   * at a branch, this is the branch's own key.
   */
  fileKey: string;

  /**
   * The key of the main file, when the URL points at a branch of it.
   */
  mainFileKey?: string;

  /**
   * The node targeted by the URL's `node-id` query parameter, if any,
   * normalised to the API format (e.g. `12:345`).
   */
  nodeId?: string;

  /**
   * The URL slug of the file name, if present (e.g. `My-Design-File`).
   */
  name?: string;
}

const FIGMA_HOSTS = ['figma.com', 'www.figma.com'];
const FILE_PATH_KINDS = ['design', 'file', 'board', 'slides', 'make', 'site'];

/**
 * Parses a URL to a Figma file into the identifiers needed to fetch that
 * file over the REST API. Supports current `/design/`, legacy `/file/`,
 * FigJam `/board/` and other file-kind URLs, as well as branch URLs.
 *
 * @param url The URL to parse.
 * @throws When the URL is not a valid Figma file URL.
 * @returns The extracted {@link FigmaFileRef}.
 */
export function parseFigmaUrl(url: string): FigmaFileRef {
  log(`Cuttings::parseFigmaUrl: parsing '${url}'.`);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Cuttings::parseFigmaUrl: not a valid URL: '${url}'.`);
  }

  if (!FIGMA_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Cuttings::parseFigmaUrl: not a Figma URL: '${url}'.`);
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  const [kind, fileKey, ...rest] = segments;

  if (!kind || !FILE_PATH_KINDS.includes(kind) || !fileKey || !/^[A-Za-z0-9]+$/.test(fileKey)) {
    throw new Error(`Cuttings::parseFigmaUrl: not a Figma file URL: '${url}'.`);
  }

  const ref: FigmaFileRef = { fileKey };

  if (rest[0] === 'branch' && rest[1]) {
    ref.mainFileKey = fileKey;
    ref.fileKey = rest[1];
    if (rest[2]) {
      ref.name = decodeURIComponent(rest[2]);
    }
  } else if (rest[0]) {
    ref.name = decodeURIComponent(rest[0]);
  }

  const nodeId = parsed.searchParams.get('node-id');
  if (nodeId) {
    ref.nodeId = nodeId.replace(/-/, ':');
  }

  log(`Cuttings::parseFigmaUrl: found file key '${ref.fileKey}'.`);

  return ref;
}
