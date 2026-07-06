import type { File, V1 } from '@figmarine/rest';

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
export function slimFile(body: V1.GetFile.ResponseBody): File {
  const file: Partial<File> = {};

  for (const field of FILE_FIELDS) {
    if (field in body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      file[field] = body[field] as any;
    }
  }

  return file as File;
}
