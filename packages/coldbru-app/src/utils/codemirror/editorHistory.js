export const MAX_CACHED_HISTORY_BYTES = 10 * 1024 * 1024;
export const MAX_UNDO_DEPTH = 100;

const histories = new Map();
const clearedPrefixes = new Set();
let cachedBytes = 0;

const removeHistory = (key) => {
  const entry = histories.get(key);
  if (!entry) return;

  cachedBytes -= entry.bytes;
  histories.delete(key);
};

const evictOldestHistories = () => {
  while (cachedBytes > MAX_CACHED_HISTORY_BYTES && histories.size > 0) {
    removeHistory(histories.keys().next().value);
  }
};

export const saveEditorHistory = (key, editor) => {
  if (
    !key
    || !editor
    || [...clearedPrefixes].some((prefix) => key.startsWith(`${prefix}:`))
    || editor.historySize().undo + editor.historySize().redo === 0
  )
    return;

  const serialized = JSON.stringify({
    value: editor.getValue(),
    history: editor.getHistory()
  });
  const bytes = serialized.length * 2;

  removeHistory(key);
  if (bytes > MAX_CACHED_HISTORY_BYTES) return;

  histories.set(key, { serialized, bytes });
  cachedBytes += bytes;
  evictOldestHistories();
};

export const restoreEditorHistory = (key, editor, value) => {
  if (!key || !editor) return;

  for (const prefix of clearedPrefixes) {
    if (key.startsWith(`${prefix}:`)) {
      clearedPrefixes.delete(prefix);
    }
  }

  const entry = histories.get(key);
  if (!entry) return;

  let saved;
  try {
    saved = JSON.parse(entry.serialized);
  } catch {
    removeHistory(key);
    return;
  }

  if (saved.value !== value) {
    removeHistory(key);
    return;
  }

  histories.delete(key);
  histories.set(key, entry);
  editor.setHistory(saved.history);
};

export const clearEditorHistory = (keyPrefix) => {
  clearedPrefixes.add(keyPrefix);
  for (const key of histories.keys()) {
    if (key.startsWith(`${keyPrefix}:`)) {
      removeHistory(key);
    }
  }
};

export const clearAllEditorHistories = () => {
  histories.clear();
  clearedPrefixes.clear();
  cachedBytes = 0;
};
