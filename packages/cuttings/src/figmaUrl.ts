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
   * normalised to the API format (e.g. `12:345`, or `I12:345;67:890` for
   * nodes nested inside instances).
   */
  nodeId?: string;

  /**
   * The URL slug of the file name, if present (e.g. `My-Design-File`).
   */
  name?: string;
}

const FIGMA_HOSTS = ['figma.com', 'www.figma.com'];
const FILE_PATH_KINDS = ['design', 'file', 'board', 'slides', 'make', 'site', 'proto', 'deck'];
const FILE_KEY_PATTERN = /^[A-Za-z0-9]+$/;

/**
 * Decodes a URL path segment, falling back to the raw segment when it
 * contains stray percent signs (the WHATWG URL parser tolerates them).
 */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Parses a URL to a Figma file into the identifiers needed to fetch that
 * file over the REST API. Supports current `/design/`, legacy `/file/`,
 * FigJam `/board/`, prototype `/proto/` and other file-kind URLs, as well
 * as branch URLs.
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

  if (!kind || !FILE_PATH_KINDS.includes(kind) || !fileKey || !FILE_KEY_PATTERN.test(fileKey)) {
    throw new Error(`Cuttings::parseFigmaUrl: not a Figma file URL: '${url}'.`);
  }

  const ref: FigmaFileRef = { fileKey };

  if (rest[0] === 'branch') {
    if (!rest[1] || !FILE_KEY_PATTERN.test(rest[1])) {
      throw new Error(`Cuttings::parseFigmaUrl: not a Figma file URL: '${url}'.`);
    }
    ref.mainFileKey = fileKey;
    ref.fileKey = rest[1];
    if (rest[2]) {
      ref.name = safeDecode(rest[2]);
    }
  } else if (rest[0]) {
    ref.name = safeDecode(rest[0]);
  }

  const nodeId = parsed.searchParams.get('node-id');
  if (nodeId) {
    ref.nodeId = nodeId.replace(/-/g, ':');
  }

  log(`Cuttings::parseFigmaUrl: found file key '${ref.fileKey}'.`);

  return ref;
}
