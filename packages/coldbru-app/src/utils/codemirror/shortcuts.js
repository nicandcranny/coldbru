import { getKeyBindingsForActionAllOS } from 'providers/Hotkeys/keyMappings';
import store from 'providers/ReduxStore/index';
import {
  navigateBack,
  navigateForward,
  reorderTabs,
  switchTab
} from 'providers/ReduxStore/slices/tabs';
import {
  savePreferences,
  toggleSidebarCollapse
} from 'providers/ReduxStore/slices/app';

const CodeMirror = require('codemirror');

const KEYBINDING_ACTIONS = [
  {
    actionName: 'navigateBack',
    handler: () => {
      if (store.getState().tabs.tabHistory?.back.length)
        store.dispatch(navigateBack());
      return true;
    }
  },
  {
    actionName: 'navigateForward',
    handler: () => {
      if (store.getState().tabs.tabHistory?.forward.length)
        store.dispatch(navigateForward());
      return true;
    }
  },
  {
    actionName: 'closeTab',
    handler: () => {
      window.dispatchEvent(new CustomEvent('close-active-tab'));
      return true;
    }
  },
  {
    actionName: 'sendRequest',
    handler: (context) => {
      if (context?.props?.onRun) context.props.onRun();
      return true;
    }
  },
  {
    actionName: 'switchToPreviousTab',
    handler: () => {
      store.dispatch(switchTab({ direction: 'pageup' }));
      return true;
    }
  },
  {
    actionName: 'switchToNextTab',
    handler: () => {
      store.dispatch(switchTab({ direction: 'pagedown' }));
      return true;
    }
  },
  {
    actionName: 'moveTabLeft',
    handler: () => {
      store.dispatch(reorderTabs({ direction: -1 }));
      return true;
    }
  },
  {
    actionName: 'moveTabRight',
    handler: () => {
      store.dispatch(reorderTabs({ direction: 1 }));
      return true;
    }
  },
  {
    actionName: 'changeLayout',
    handler: () => {
      const state = store.getState();
      const preferences = state.app.preferences;
      const currentOrientation
        = preferences?.layout?.responsePaneOrientation || 'horizontal';
      const newOrientation
        = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
      const updatedPreferences = {
        ...preferences,
        layout: {
          ...preferences.layout,
          responsePaneOrientation: newOrientation
        }
      };
      store.dispatch(savePreferences(updatedPreferences));
      return true;
    }
  },
  {
    actionName: 'collapseSidebar',
    handler: () => {
      store.dispatch(toggleSidebarCollapse());
      return true;
    }
  },
  {
    actionName: 'formatJson',
    handler: (context) => {
      if (context?.props?.onPrettify) {
        context.props.onPrettify();
        return true;
      }

      return false;
    }
  }
];

/**
 * Converts user keybinding format to CodeMirror format
 * e.g., "command+bind+enter" -> "Cmd-Enter"
 * @param {string} combo - The keybinding combo string
 * @returns {string|null} CodeMirror formatted combo or null
 */
function convertToCodeMirrorFormat(combo) {
  if (!combo || typeof combo !== 'string') return null;

  const hasMinusKey = combo.endsWith('+-');
  const normalized = (
    hasMinusKey ? `${combo.slice(0, -1)}minus` : combo.replace(/-/g, '+')
  )
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p.toLowerCase() !== 'bind')
    .join('+');

  const parts = normalized
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  const out = parts.map((key) => {
    const lower = key.toLowerCase();

    if (lower === 'command' || lower === 'cmd') return 'Cmd';
    if (lower === 'control' || lower === 'ctrl') return 'Ctrl';
    if (lower === 'option' || lower === 'alt') return 'Alt';
    if (lower === 'shift') return 'Shift';
    if (lower === 'mod') return 'Mod';

    if (lower === 'enter' || lower === 'return') return 'Enter';
    if (lower === 'esc' || lower === 'escape') return 'Esc';
    if (lower === 'space') return 'Space';
    if (lower === 'tab') return 'Tab';
    if (lower === 'backspace') return 'Backspace';
    if (lower === 'delete' || lower === 'del') return 'Delete';
    if (lower === 'up') return 'Up';
    if (lower === 'down') return 'Down';
    if (lower === 'left') return 'Left';
    if (lower === 'right') return 'Right';
    if (lower === 'minus') return '-';

    if (key.length === 1) return key.toUpperCase();
    return key.charAt(0).toUpperCase() + key.slice(1);
  });

  const modifierOrder = ['Shift', 'Cmd', 'Ctrl', 'Alt', 'Mod'];
  out.sort((a, b) => {
    const aIndex = modifierOrder.indexOf(a);
    const bIndex = modifierOrder.indexOf(b);
    return (
      (aIndex < 0 ? modifierOrder.length : aIndex)
      - (bIndex < 0 ? modifierOrder.length : bIndex)
    );
  });

  return out.join('-');
}

/**
 * Builds a consolidated CodeMirror keymap from all configured keybinding actions.
 * Uses CodeMirror.Pass for non-matching keys to allow default behavior.
 * @param {Object} context - Context object containing props and other editor context
 * @returns {Object} CodeMirror keymap object
 */
function buildKeymap(context) {
  let state;
  try {
    const reduxState = store.getState();
    state = reduxState;
  } catch {
    state = { app: { preferences: {} } };
  }

  const userKeyBindings = state.app.preferences?.keyBindings || {};

  // Create a comprehensive keymap with CodeMirror.Pass as fallthrough
  // This allows non-matching keys to pass through to default CodeMirror behavior
  const keyMap = {
    name: 'singleLineEditor.custom',
    // CodeMirror.Pass tells CodeMirror to pass this key event to the next keymap
    // This is the key to making non-configured keys work normally
    fallthrough: CodeMirror.Pass
  };

  // Build keymap entries for each configured action
  KEYBINDING_ACTIONS.forEach(({ actionName, handler }) => {
    const combos
      = getKeyBindingsForActionAllOS(actionName, userKeyBindings) || [];
    const cmCombos = combos
      .map((k) => convertToCodeMirrorFormat(k))
      .filter(Boolean);

    if (cmCombos.length > 0) {
      cmCombos.forEach((cmKey) => {
        // Create handler that passes context as argument
        keyMap[cmKey] = () => handler(context);
      });
    }
  });

  return keyMap;
}

/**
 * Sets up keyboard shortcuts for a CodeMirror editor instance.
 * This enables custom keybindings with CodeMirror.Pass fallthrough support.
 * @param {Object} editor - The CodeMirror editor instance
 * @param {Object} context - Context object containing props and other editor context
 * @returns {Object} Cleanup function to remove the keymap
 */
function setupShortcuts(editor, context = {}, storeInstance = store) {
  if (!editor) {
    return () => {};
  }

  let currentKeyMap = null;
  let unsubscribeStore = null;
  let previousKeyBindings = null;

  /**
   * Apply the consolidated custom keymap to the CodeMirror editor
   */
  const applyKeyMap = () => {
    if (!editor) return;

    // Remove existing custom keymap if any
    if (currentKeyMap) {
      try {
        editor.removeKeyMap(currentKeyMap);
      } catch (e) {
        console.warn('[SingleLineEditor] Error removing keymap:', e);
      }
    }

    // Build and apply new consolidated keymap
    currentKeyMap = buildKeymap(context);
    editor.addKeyMap(currentKeyMap);
  };

  // Apply keymap on setup
  applyKeyMap();
  previousKeyBindings = storeInstance.getState()?.app?.preferences?.keyBindings;

  // Subscribe to store changes to rebuild keymap when preferences change
  unsubscribeStore = storeInstance.subscribe(() => {
    const nextKeyBindings
      = storeInstance.getState()?.app?.preferences?.keyBindings;
    if (nextKeyBindings === previousKeyBindings) {
      return;
    }

    previousKeyBindings = nextKeyBindings;
    applyKeyMap();
  });

  /**
   * Cleanup function to remove the keymap and unsubscribe from store
   */
  const cleanup = () => {
    if (unsubscribeStore) {
      unsubscribeStore();
      unsubscribeStore = null;
    }

    if (editor && currentKeyMap) {
      try {
        editor.removeKeyMap(currentKeyMap);
      } catch (e) {
        console.warn('[SingleLineEditor] Error removing keymap on cleanup:', e);
      }
      currentKeyMap = null;
    }
  };

  return cleanup;
}

export {
  setupShortcuts,
  buildKeymap,
  convertToCodeMirrorFormat,
  KEYBINDING_ACTIONS
};
