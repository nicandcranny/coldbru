const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  isPostmanWorkspaceExportDirectory,
  readPostmanWorkspaceExportDirectory
} = require('../../src/utils/postman-workspace-import');

describe('postman workspace import utils', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coldbru-postman-export-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('detects a Postman workspace export directory', () => {
    fs.writeFileSync(path.join(tempDir, 'archive.json'), JSON.stringify({ collection: {}, environment: {} }));
    fs.mkdirSync(path.join(tempDir, 'collection'));
    fs.writeFileSync(
      path.join(tempDir, 'collection', 'sample.json'),
      JSON.stringify({ info: { name: 'Sample Collection' }, item: [] })
    );

    expect(isPostmanWorkspaceExportDirectory(tempDir)).toBe(true);
  });

  test('reads collections and environments from a Postman workspace export directory', () => {
    fs.writeFileSync(path.join(tempDir, 'archive.json'), JSON.stringify({ collection: {}, environment: {} }));
    fs.mkdirSync(path.join(tempDir, 'collection'));
    fs.mkdirSync(path.join(tempDir, 'environment'));
    fs.writeFileSync(
      path.join(tempDir, 'collection', 'sample.json'),
      JSON.stringify({ info: { name: 'Sample Collection' }, item: [] })
    );
    fs.writeFileSync(
      path.join(tempDir, 'environment', 'sample.json'),
      JSON.stringify({ name: 'Sample Environment', values: [] })
    );

    const result = readPostmanWorkspaceExportDirectory(tempDir);

    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].content.info.name).toBe('Sample Collection');
    expect(result.environments).toHaveLength(1);
    expect(result.environments[0].content.name).toBe('Sample Environment');
  });

  test('rejects directories that are not Postman exports', () => {
    fs.mkdirSync(path.join(tempDir, 'collection'));
    fs.writeFileSync(
      path.join(tempDir, 'collection', 'sample.json'),
      JSON.stringify({ info: { name: 'Sample Collection' }, item: [] })
    );

    expect(isPostmanWorkspaceExportDirectory(tempDir)).toBe(false);
    expect(() => readPostmanWorkspaceExportDirectory(tempDir)).toThrow(
      'Invalid Postman export: archive.json or exported items not found'
    );
  });
});
