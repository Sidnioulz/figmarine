import { V1 } from '../__generated__/figmaRestApi';

export type File = Pick<
  V1.GetFile.ResponseBody,
  | 'name'
  | 'lastModified'
  | 'editorType'
  | 'version'
  | 'document'
  | 'components'
  | 'componentSets'
  | 'schemaVersion'
  | 'styles'
  | 'mainFileKey'
  | 'branches'
>;
