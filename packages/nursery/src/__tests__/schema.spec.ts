import { readFileSync } from 'node:fs';

import { z } from 'zod';

import { NurseryConfigSchema } from '../config';

describe('@figmarine/nursery - published JSON schema', () => {
  it('matches the zod config schema', () => {
    const committed = JSON.parse(
      readFileSync(new URL('../../schema/nursery.schema.json', import.meta.url), 'utf-8'),
    );

    const generated = z.toJSONSchema(NurseryConfigSchema, { io: 'input' }) as Record<
      string,
      unknown
    >;
    generated.title = committed.title;
    generated.description = committed.description;

    expect(committed).toStrictEqual(generated);
  });
});
