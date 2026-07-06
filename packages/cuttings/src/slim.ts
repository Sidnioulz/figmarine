import type { File, V1 } from '@figmarine/rest';

/**
 * A branch entry as stored in a Cutting: the volatile signed
 * `thumbnail_url` is dropped so refreshes stay diff-stable.
 */
export type SlimBranch = Omit<NonNullable<File['branches']>[number], 'thumbnail_url'>;

/**
 * A Figma file as stored in a Cutting: the fields of `File`, with branch
 * entries slimmed of their volatile thumbnail URLs.
 */
export type SlimFile = Omit<File, 'branches'> & { branches?: SlimBranch[] };

/**
 * The fields of a `GetFile` response body kept in a Cutting. Everything
 * else (thumbnails, access role, link settings…) is volatile or
 * irrelevant to offline analysis and would create meaningless diffs when
 * cuttings are committed to a repository.
 *
 * Must stay in sync with the `File` type of `@figmarine/rest`; the
 * `satisfies` clause and the assertion below make drift a compile error.
 */
const FILE_FIELDS = [
  'name',
  'lastModified',
  'editorType',
  'version',
  'document',
  'components',
  'componentSets',
  'schemaVersion',
  'styles',
  'mainFileKey',
  'branches',
] as const satisfies readonly (keyof File)[];

type MissingFileField = Exclude<keyof File, (typeof FILE_FIELDS)[number]>;
// Compile-time completeness check: fails when File gains a field that
// FILE_FIELDS does not list.
true satisfies MissingFileField extends never ? true : false;

/**
 * Slims a `GetFile` response body down to the fields worth storing in a
 * Cutting.
 * @param body The raw `GetFile` response body.
 * @returns The slimmed file.
 */
export function slimFile(body: V1.GetFile.ResponseBody): SlimFile {
  const file: Partial<SlimFile> = {};

  for (const field of FILE_FIELDS) {
    if (field in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      file[field] = body[field] as any;
    }
  }

  if (body.branches) {
    file.branches = body.branches.map(({ thumbnail_url: _thumbnailUrl, ...branch }) => branch);
  }

  return file as SlimFile;
}
