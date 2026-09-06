import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import SingleLineEditor from './index';
import {
  clearAllEditorHistories,
  MAX_UNDO_DEPTH
} from 'utils/codemirror/editorHistory';

const mockEditors = [];

jest.mock('codemirror', () =>
  jest.fn((_node, options) => {
    const wrapper = global.document.createElement('div');
    const editor = {
      options,
      getHistory: jest.fn(() => ({ done: ['change'], undone: [] })),
      getValue: jest.fn(() => options.value),
      historySize: jest.fn(() => ({ undo: 0, redo: 0 })),
      setHistory: jest.fn(),
      setValue: jest.fn(),
      getCursor: jest.fn(() => ({ line: 0, ch: 0 })),
      setCursor: jest.fn(),
      hasFocus: jest.fn(() => false),
      on: jest.fn(),
      off: jest.fn(),
      setOption: jest.fn(),
      getWrapperElement: jest.fn(() => wrapper)
    };
    mockEditors.push(editor);
    return editor;
  })
);

jest.mock('utils/collections', () => ({
  getAllVariables: jest.fn(() => ({}))
}));
jest.mock('utils/common/codemirror', () => ({
  defineCodeMirrorBrunoVariablesMode: jest.fn()
}));
jest.mock('utils/codemirror/autocomplete', () => ({
  setupAutoComplete: jest.fn(() => jest.fn())
}));
jest.mock('utils/codemirror/linkAware', () => ({ setupLinkAware: jest.fn() }));
jest.mock('utils/codemirror/shortcuts', () => ({
  setupShortcuts: jest.fn(() => jest.fn())
}));
jest.mock('utils/common/masked-editor', () => ({ MaskedEditor: jest.fn() }));

const theme = {
  font: { size: { base: '14px' } },
  codemirror: { placeholder: { color: '#999', opacity: 1 } },
  text: '#fff'
};

const renderEditor = (props) =>
  render(
    <ThemeProvider theme={theme}>
      <SingleLineEditor {...props} />
    </ThemeProvider>
  );

describe('SingleLineEditor undo history', () => {
  beforeEach(() => {
    mockEditors.length = 0;
    clearAllEditorHistories();
  });

  it('loads its initial value without creating an undoable setValue change', () => {
    renderEditor({ value: 'Accept' });

    expect(mockEditors[0].options.value).toBe('Accept');
    expect(mockEditors[0].options.undoDepth).toBe(MAX_UNDO_DEPTH);
    expect(mockEditors[0].setValue).not.toHaveBeenCalled();
  });

  it('restores history when remounted with the same value and key', () => {
    const first = renderEditor({
      value: 'before',
      historyKey: 'request-1:headers:row-1:value'
    });
    mockEditors[0].getValue.mockReturnValue('after');
    mockEditors[0].historySize.mockReturnValue({ undo: 1, redo: 0 });
    first.unmount();

    renderEditor({
      value: 'after',
      historyKey: 'request-1:headers:row-1:value'
    });

    expect(mockEditors[1].setHistory).toHaveBeenCalledWith({
      done: ['change'],
      undone: []
    });
  });
});
