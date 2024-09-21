import * as index from '../index';

describe('@figmarine/rest - index', () => {
  it('exports something', () => {
    expect(index).toBeDefined();
    expect(index.Client).toBeDefined();
  });
});
