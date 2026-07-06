import { readFileSync } from 'node:fs';

import { buildConfigJsonSchema } from '../schema';

describe('@figmarine/nursery - published JSON schema', () => {
  it('matches the zod config schema', () => {
    const committed = JSON.parse(
      readFileSync(new URL('../../schema/nursery.schema.json', import.meta.url), 'utf-8'),
    );

    expect(committed).toStrictEqual(buildConfigJsonSchema());
  });
});
