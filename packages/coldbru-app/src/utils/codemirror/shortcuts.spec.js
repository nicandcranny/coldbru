const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

jest.mock('codemirror', () => ({
  Pass: 'CodeMirror.Pass'
}));

jest.mock('providers/Hotkeys/keyMappings', () => ({
  getKeyBindingsForActionAllOS: jest.fn(() => [])
}));

jest.mock('providers/ReduxStore/index', () => ({
  dispatch: jest.fn(),
  getState: jest.fn(() => ({
    app: {
      preferences: {}
    }
  })),
  subscribe: jest.fn()
}));

jest.mock('providers/ReduxStore/slices/tabs', () => ({
  reorderTabs: jest.fn((payload) => ({ type: 'tabs/reorderTabs', payload })),
  switchTab: jest.fn((payload) => ({ type: 'tabs/switchTab', payload }))
}));

jest.mock('providers/ReduxStore/slices/app', () => ({
  savePreferences: jest.fn((payload) => ({ type: 'app/savePreferences', payload })),
  toggleSidebarCollapse: jest.fn(() => ({ type: 'app/toggleSidebarCollapse' }))
}));

const { setupShortcuts } = require('./shortcuts');
const { getKeyBindingsForActionAllOS } = require('providers/Hotkeys/keyMappings');

describe('setupShortcuts', () => {
  let editor;
  let mockStore;
  let state;
  let listener;
  let unsubscribe;

  beforeEach(() => {
    editor = {
      addKeyMap: jest.fn(),
      removeKeyMap: jest.fn()
    };

    listener = null;
    unsubscribe = jest.fn();
    state = {
      app: {
        preferences: {
          keyBindings: {
            sendRequest: ['command+enter']
          }
        }
      }
    };

    mockStore = {
      dispatch: jest.fn(),
      getState: jest.fn(() => state),
      subscribe: jest.fn((cb) => {
        listener = cb;
        return unsubscribe;
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not rebuild keymap when store updates without keybinding changes', () => {
    const cleanup = setupShortcuts(editor, {}, mockStore);

    expect(editor.addKeyMap).toHaveBeenCalledTimes(1);
    expect(typeof listener).toBe('function');

    listener();

    expect(editor.removeKeyMap).not.toHaveBeenCalled();
    expect(editor.addKeyMap).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it('rebuilds keymap when keybindings reference changes', () => {
    setupShortcuts(editor, {}, mockStore);

    state = {
      app: {
        preferences: {
          keyBindings: {
            sendRequest: ['ctrl+enter']
          }
        }
      }
    };

    expect(typeof listener).toBe('function');
    listener();

    expect(editor.removeKeyMap).toHaveBeenCalledTimes(1);
    expect(editor.addKeyMap).toHaveBeenCalledTimes(2);
  });

  it('calls onPrettify when format json shortcut fires', () => {
    const onPrettify = jest.fn();
    getKeyBindingsForActionAllOS.mockImplementation((action) => {
      if (action === 'formatJson') {
        return ['shift+alt+f'];
      }

      return [];
    });

    setupShortcuts(editor, { props: { onPrettify } }, mockStore);

    const keyMap = editor.addKeyMap.mock.calls[0][0];
    expect(typeof keyMap['Shift-Alt-F']).toBe('function');

    const handled = keyMap['Shift-Alt-F']();

    expect(handled).toBe(true);
    expect(onPrettify).toHaveBeenCalledTimes(1);
  });
});
