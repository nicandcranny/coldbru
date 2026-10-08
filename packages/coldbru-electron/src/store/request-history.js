const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const { getPreferences } = require('./preferences');
const { uuid } = require('../utils/common');

const DEFAULT_MAX_ENTRIES = 500;

// Small summaries live in one index; each full entry (request + response) is its own file
const index = new Store({
  name: 'request-history-index',
  clearInvalidConfig: true
});

const getDir = () => path.join(app.getPath('userData'), 'request-history');
const getEntryPath = (id) => path.join(getDir(), `${id}.json`);

const toSummary = (entry) => ({
  id: entry.id,
  timestamp: entry.timestamp,
  name: entry.item?.name,
  method: entry.method,
  url: entry.url,
  // gRPC responses carry statusText (e.g. OK, UNAVAILABLE) instead of an HTTP status
  status: entry.response?.status ?? entry.response?.statusText,
  isError: Boolean(entry.response?.isError),
  duration: entry.response?.duration,
  size: entry.response?.size
});

const getMaxEntries = () => getPreferences()?.history?.maxEntries || DEFAULT_MAX_ENTRIES;

// Summaries are stored newest first
const getSummaries = () => index.get('summaries') || [];

// Entries are immutable: written once, only ever deleted
const addEntry = async (entry) => {
  const id = uuid();
  await fs.mkdir(getDir(), { recursive: true });
  await fs.writeFile(getEntryPath(id), JSON.stringify({ ...entry, id }));

  const summary = toSummary({ ...entry, id });
  const summaries = [summary, ...getSummaries()];
  const maxEntries = getMaxEntries();
  index.set('summaries', summaries.slice(0, maxEntries));
  await Promise.all(summaries.slice(maxEntries).map((s) => fs.rm(getEntryPath(s.id), { force: true })));

  return summary;
};

const getEntry = async (id) => {
  // Only ids from the index are read, so a renderer-supplied id can't point outside the history dir
  if (!getSummaries().some((s) => s.id === id)) {
    return null;
  }
  return JSON.parse(await fs.readFile(getEntryPath(id), 'utf8'));
};

const clearEntries = async () => {
  index.set('summaries', []);
  await fs.rm(getDir(), { recursive: true, force: true });
};

module.exports = {
  addEntry,
  getSummaries,
  getEntry,
  clearEntries
};
