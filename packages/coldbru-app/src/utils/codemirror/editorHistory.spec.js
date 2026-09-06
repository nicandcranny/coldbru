import {
  MAX_CACHED_HISTORY_BYTES,
  clearAllEditorHistories,
  clearEditorHistory,
  restoreEditorHistory,
  saveEditorHistory
} from './editorHistory';

const createEditor = ({
  value = 'current',
  undo = 1,
  redo = 0,
  history = { done: ['change'], undone: [] }
} = {}) => ({
  getHistory: jest.fn(() => history),
  getValue: jest.fn(() => value),
  historySize: jest.fn(() => ({ undo, redo })),
  setHistory: jest.fn()
});

describe('editorHistory', () => {
  beforeEach(() => {
    clearAllEditorHistories();
  });

  it('restores matching history after an editor remounts', () => {
    const previousEditor = createEditor();
    const nextEditor = createEditor({ undo: 0 });

    saveEditorHistory('request-1:headers:row-1:value', previousEditor);
    restoreEditorHistory(
      'request-1:headers:row-1:value',
      nextEditor,
      'current'
    );

    expect(nextEditor.setHistory).toHaveBeenCalledWith({
      done: ['change'],
      undone: []
    });
  });

  it('drops history when the current value changed while unmounted', () => {
    saveEditorHistory('request-1:body:json', createEditor());
    const nextEditor = createEditor({ value: 'external change', undo: 0 });

    restoreEditorHistory('request-1:body:json', nextEditor, 'external change');

    expect(nextEditor.setHistory).not.toHaveBeenCalled();
  });

  it('does not restore history after a request tab closes', () => {
    const key = 'request-1:params:row-1:value';
    clearEditorHistory('request-1');
    saveEditorHistory(key, createEditor());
    const nextEditor = createEditor({ undo: 0 });

    restoreEditorHistory(key, nextEditor, 'current');

    expect(nextEditor.setHistory).not.toHaveBeenCalled();
  });

  it('does not cache one history larger than the total memory limit', () => {
    const oversizedText = 'x'.repeat(MAX_CACHED_HISTORY_BYTES / 2);
    const history = {
      done: [{ changes: [{ text: [oversizedText] }] }],
      undone: []
    };
    const nextEditor = createEditor({ undo: 0 });

    saveEditorHistory('request-1:body:json', createEditor({ history }));
    restoreEditorHistory('request-1:body:json', nextEditor, 'current');

    expect(nextEditor.setHistory).not.toHaveBeenCalled();
  });
});
