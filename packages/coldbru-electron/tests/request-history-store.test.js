const fs = require('fs');
const os = require('os');
const path = require('path');

const mockUserData = fs.mkdtempSync(path.join(os.tmpdir(), 'request-history-'));
const mockPreferences = { history: { maxEntries: 2 } };

jest.mock('electron', () => ({
  app: { getPath: () => mockUserData }
}));

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => {
    const data = {};
    return {
      get: (key) => data[key],
      set: (key, value) => {
        data[key] = value;
      }
    };
  });
});

jest.mock('../src/store/preferences', () => ({
  getPreferences: () => mockPreferences
}));

const { addEntry, getSummaries, getEntry, clearEntries } = require('../src/store/request-history');

const historyDir = path.join(mockUserData, 'request-history');

const makeEntry = (name) => ({
  timestamp: Date.now(),
  method: 'GET',
  url: `https://example.com/${name}`,
  item: { type: 'http-request', name, request: { method: 'GET', url: `https://example.com/${name}` } },
  response: { status: 200, duration: 12, size: 34, data: { name } }
});

afterAll(() => fs.rmSync(mockUserData, { recursive: true, force: true }));

describe('request history store', () => {
  test('stores one file per entry, newest first, truncated to the configured limit', async () => {
    const a = await addEntry(makeEntry('a'));
    const b = await addEntry(makeEntry('b'));
    const c = await addEntry(makeEntry('c'));

    expect(c).toMatchObject({ name: 'c', method: 'GET', status: 200, isError: false, url: 'https://example.com/c' });
    expect(getSummaries().map((s) => s.name)).toEqual(['c', 'b']);
    expect(fs.readdirSync(historyDir).sort()).toEqual([`${b.id}.json`, `${c.id}.json`].sort());
    expect(await getEntry(a.id)).toBeNull();
    expect((await getEntry(b.id)).response.data).toEqual({ name: 'b' });
  });

  test('rejects ids that are not in the index', async () => {
    expect(await getEntry('../../etc/passwd')).toBeNull();
  });

  test('clear removes all entries and files', async () => {
    await clearEntries();

    expect(getSummaries()).toEqual([]);
    expect(fs.existsSync(historyDir)).toBe(false);
  });
});
