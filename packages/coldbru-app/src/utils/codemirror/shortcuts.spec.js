const { describe, it, expect, jest, beforeEach, afterEach } = require('@jest/globals');

jest.mock('codemirror', () => ({
  Pass: 'CodeMirror.Pass'
}));

jest.mock('providers/Hotkeys/keyMappings', () => ({
  getKeyBindingsForActionAllOS: jest.fn(() => [])
}));

jest.mock('providers/ReduxStore/slices/tabs', () => ({
  reorderTabs: jest.fn((payload) => ({ type: 'tabs/reorderTabs', payload })),
  switchTab: jest.fn((payload) => ({ type: 'tabs/switchTab', payload }))
}));

jest.mock('providers/ReduxStore/slices/app', () => ({
  savePreferences: jest.fn((payload) => ({ type: 'app/savePreferences', payload })),
  toggleSidebarCollapse: jest.fn(() => ({ type: 'app/toggleSidebarCollapse' }))
}));

import { setupShortcuts } from './shortcuts';

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
});
