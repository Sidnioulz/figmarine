import * as index from '../index';

describe('@figmarine/cuttings - index', () => {
  it('exports something', () => {
    expect(index).toBeDefined();
    expect(index.take).toBeDefined();
    expect(index.digCutting).toBeDefined();
    expect(index.plantCutting).toBeDefined();
  });
});
