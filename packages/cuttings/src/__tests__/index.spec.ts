import * as index from '../index';

describe('@figmarine/cuttings - index', () => {
  it('exports the cutting lifecycle API', () => {
    expect(index).toBeDefined();
    expect(index.take).toBeDefined();
    expect(index.hydrate).toBeDefined();
    expect(index.digCutting).toBeDefined();
    expect(index.plantCutting).toBeDefined();
    expect(index.parseFigmaUrl).toBeDefined();
    expect(index.slimFile).toBeDefined();
    expect(index.isCutting).toBeDefined();
    expect(index.isFacet).toBeDefined();
  });
});
