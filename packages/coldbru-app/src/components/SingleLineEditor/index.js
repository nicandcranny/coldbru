import React, { Component } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { getAllVariables } from 'utils/collections';
import { defineCodeMirrorBrunoVariablesMode } from 'utils/common/codemirror';
import { MaskedEditor } from 'utils/common/masked-editor';
import { setupAutoComplete } from 'utils/codemirror/autocomplete';
import StyledWrapper from './StyledWrapper';
import { IconEye, IconEyeOff } from '@tabler/icons';
import { setupLinkAware } from 'utils/codemirror/linkAware';
import { setupShortcuts } from 'utils/codemirror/shortcuts';

const CodeMirror = require('codemirror');

class SingleLineEditor extends Component {
  constructor(props) {
    super(props);
    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
    this.editorRef = React.createRef();
    this.variables = {};
    this.readOnly = props.readOnly || false;

    // Shortcuts cleanup function
    this._shortcutsCleanup = null;
    this._pendingChange = false;
    this._setupDebouncedOnChange(props);

    this.state = {
      maskInput: props.isSecret || false
    };
  }

  componentDidMount() {
    // Initialize CodeMirror as a single line editor
    /** @type {import("codemirror").Editor} */
    const variables = this._getVariables(this.props);

    const runHandler = () => {
      this._flushPendingChange();
      if (this.props.onRun) {
        this.props.onRun();
      }
    };
    const saveHandler = () => {
      this._flushPendingChange();
      if (this.props.onSave) {
        this.props.onSave();
      }
    };
    const noopHandler = () => { };

    this.editor = CodeMirror(this.editorRef.current, {
      placeholder: this.props.placeholder ?? '',
      lineWrapping: false,
      lineNumbers: false,
      theme: this.props.theme === 'dark' ? 'monokai' : 'default',
      mode: 'brunovariables',
      coldbruVarInfo: this.props.enableBrunoVarInfo !== false ? {
        variables,
        collection: this.props.collection,
        item: this.props.item
      } : false,
      scrollbarStyle: null,
      tabindex: 0,
      readOnly: this.props.readOnly,
      extraKeys: {
        'Enter': runHandler,
        // 'Ctrl-Enter': runHandler,
        // 'Cmd-Enter': runHandler,
        'Alt-Enter': () => {
          if (this.props.allowNewlines) {
            this.editor.setValue(this.editor.getValue() + '\n');
            this.editor.setCursor({ line: this.editor.lineCount(), ch: 0 });
          } else if (this.props.onRun) {
            this.props.onRun();
          }
        },
        // 'Shift-Enter': runHandler,
        'Cmd-S': saveHandler,
        'Ctrl-S': saveHandler,
        'Cmd-F': noopHandler,
        'Ctrl-F': noopHandler,
        // Tabbing disabled to make tabindex work
        'Tab': false,
        'Shift-Tab': false
      }
    });

    const getAllVariablesHandler = () => this._getVariables(this.props);
    const getAnywordAutocompleteHints = () => this.props.autocomplete || [];

    // Setup AutoComplete Helper
    const autoCompleteOptions = {
      getAllVariables: getAllVariablesHandler,
      getAnywordAutocompleteHints,
      showHintsFor: this.props.showHintsFor || ['variables'],
      showHintsOnClick: this.props.showHintsOnClick
    };

    this.brunoAutoCompleteCleanup = setupAutoComplete(
      this.editor,
      autoCompleteOptions
    );

    this.editor.setValue(String(this.props.value ?? ''));
    this.editor.on('change', this._onEdit);
    this.editor.on('paste', this._onPaste);
    this.editor.on('blur', this._flushPendingChange);
    this.addOverlay(variables);
    this._enableMaskedEditor(this.props.isSecret);
    this.setState({ maskInput: this.props.isSecret });

    // Add newline arrow markers if enabled
    if (this.props.showNewlineArrow) {
      this._updateNewlineMarkers();
    }
    setupLinkAware(this.editor);

    // Setup keyboard shortcuts using the dedicated utility
    this._shortcutsCleanup = setupShortcuts(this.editor, this);
  }

  /** Enable or disable masking the rendered content of the editor */
  _enableMaskedEditor = (enabled) => {
    if (typeof enabled !== 'boolean') return;

    if (enabled == true) {
      if (!this.maskedEditor) this.maskedEditor = new MaskedEditor(this.editor, '*');
      this.maskedEditor.enable();
    } else {
      if (this.maskedEditor) {
        this.maskedEditor.disable();
        this.maskedEditor.destroy();
        this.maskedEditor = null;
      }
    }
  };

  _onEdit = () => {
    if (!this.ignoreChangeEvent && this.editor) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onChange && (this.props.value !== this.cachedValue)) {
        if (this._debouncedOnChange) {
          this._pendingChange = true;
          this._debouncedOnChange(this.cachedValue);
        } else {
          this.props.onChange(this.cachedValue);
        }
      }

      // Update newline markers after edit
      if (this.props.showNewlineArrow) {
        this._updateNewlineMarkers();
      }
    }
  };

  _onPaste = (_, event) => this.props.onPaste?.(event);

  componentDidUpdate(prevProps) {
    // Ensure the changes caused by this update are not interpreted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;

    if (this.props.changeDebounceMs !== prevProps.changeDebounceMs) {
      this._teardownDebouncedOnChange();
      this._setupDebouncedOnChange(this.props);
    }

    let variables = this._getVariables(this.props);
    if (!isEqual(variables, this.variables)) {
      if (this.props.enableBrunoVarInfo !== false && this.editor.options.coldbruVarInfo) {
        this.editor.options.coldbruVarInfo.variables = variables;
      }
      this.addOverlay(variables);
    }

    // The request/collection trees can be large, so avoid deep comparisons here.
    // Redux gives us new references when these objects change.
    if (this.props.enableBrunoVarInfo !== false && this.editor.options.coldbruVarInfo) {
      if (this.props.collection !== prevProps.collection) {
        this.editor.options.coldbruVarInfo.collection = this.props.collection;
      }
      if (this.props.item !== prevProps.item) {
        this.editor.options.coldbruVarInfo.item = this.props.item;
      }
    }
    if (this.props.theme !== prevProps.theme && this.editor) {
      this.editor.setOption('theme', this.props.theme === 'dark' ? 'monokai' : 'default');
    }
    if (this.props.value !== prevProps.value && this.props.value !== this.cachedValue && this.editor) {
      // TODO: temporary fix for keeping cursor state when auto save and new line insertion collide PR#7098
      const nextValue = String(this.props.value ?? '');
      const currentValue = this.editor.getValue();
      if (this.editor.hasFocus?.() && currentValue !== nextValue && nextValue !== '') {
        this.cachedValue = currentValue;
      } else {
        const cursor = this.editor.getCursor();
        this.cachedValue = nextValue;
        this.editor.setValue(nextValue);
        this.editor.setCursor(cursor);

        // Update newline markers after value change
        if (this.props.showNewlineArrow) {
          this._updateNewlineMarkers();
        }
      }
    }
    if (!isEqual(this.props.isSecret, prevProps.isSecret)) {
      // If the secret flag has changed, update the editor to reflect the change
      this._enableMaskedEditor(this.props.isSecret);
      // also set the maskInput flag to the new value
      this.setState({ maskInput: this.props.isSecret });
    }
    if (this.props.readOnly !== prevProps.readOnly && this.editor) {
      this.editor.setOption('readOnly', this.props.readOnly);
    }
    if (this.props.placeholder !== prevProps.placeholder && this.editor) {
      this.editor.setOption('placeholder', this.props.placeholder);
    }
    this.ignoreChangeEvent = false;
  }

  componentWillUnmount() {
    // Cleanup shortcuts (keymap and store subscription)
    if (this._shortcutsCleanup) {
      this._shortcutsCleanup();
      this._shortcutsCleanup = null;
    }

    if (this.editor) {
      this._flushPendingChange();
      if (this.editor?._destroyLinkAware) {
        this.editor._destroyLinkAware();
      }
      this.editor.off('change', this._onEdit);
      this.editor.off('paste', this._onPaste);
      this.editor.off('blur', this._flushPendingChange);
      this._clearNewlineMarkers();
      this.editor.getWrapperElement().remove();
      this.editor = null;
    }
    if (this.brunoAutoCompleteCleanup) {
      this.brunoAutoCompleteCleanup();
    }
    if (this.maskedEditor) {
      this.maskedEditor.destroy();
      this.maskedEditor = null;
    }
    this._teardownDebouncedOnChange();
  }

  _setupDebouncedOnChange = (props) => {
    if (!props?.changeDebounceMs) {
      this._debouncedOnChange = null;
      return;
    }

    this._debouncedOnChange = debounce((value) => {
      this._pendingChange = false;
      this.props.onChange?.(value);
    }, props.changeDebounceMs);
  };

  _teardownDebouncedOnChange = () => {
    this._debouncedOnChange?.cancel();
    this._debouncedOnChange = null;
    this._pendingChange = false;
  };

  _flushPendingChange = () => {
    if (!this._pendingChange || !this.props.onChange) {
      return;
    }

    this._debouncedOnChange?.cancel();
    this._pendingChange = false;
    this.props.onChange(this.cachedValue);
  };

  _shouldUseVariables = (props = this.props) => {
    if (props.enableBrunoVarInfo !== false) {
      return true;
    }

    return Array.isArray(props.showHintsFor) && props.showHintsFor.includes('variables');
  };

  _getVariables = (props = this.props) => {
    if (!this._shouldUseVariables(props)) {
      return {};
    }

    return getAllVariables(props.collection, props.item);
  };

  addOverlay = (variables) => {
    this.variables = variables;
    defineCodeMirrorBrunoVariablesMode(variables, 'text/plain', this.props.highlightPathParams, true);
    this.editor.setOption('mode', 'brunovariables');
  };

  /**
   * Update markers to show arrows for newlines
   */
  _updateNewlineMarkers = () => {
    if (!this.editor) return;

    // Clear existing markers
    this._clearNewlineMarkers();

    this.newlineMarkers = [];
    const content = this.editor.getValue();

    // Find all newlines and replace them with arrow widgets
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        const pos = this.editor.posFromIndex(i);
        const nextPos = this.editor.posFromIndex(i + 1);

        // Create a widget to display the arrow
        const arrow = document.createElement('span');
        arrow.className = 'newline-arrow';
        arrow.textContent = '↲';
        arrow.style.cssText = `
          color: #888;
          font-size: 8px;
          margin: 0 2px;
          vertical-align: middle;
          display: inline-block;
        `;

        // Mark the newline character and replace it with the arrow widget
        const marker = this.editor.markText(pos, nextPos, {
          replacedWith: arrow,
          handleMouseEvents: true
        });

        this.newlineMarkers.push(marker);
      }
    }
  };

  /**
   * Clear all newline markers
   */
  _clearNewlineMarkers = () => {
    if (this.newlineMarkers) {
      this.newlineMarkers.forEach((marker) => {
        try {
          marker.clear();
        } catch (e) {
          // Marker might already be cleared
        }
      });
      this.newlineMarkers = [];
    }
  };

  toggleVisibleSecret = () => {
    const isVisible = !this.state.maskInput;
    this.setState({ maskInput: isVisible });
    this._enableMaskedEditor(isVisible);
  };

  /**
   * @brief Eye icon to show/hide the secret value
   * @returns ReactComponent The eye icon
   */
  secretEye = (isSecret) => {
    return isSecret === true ? (
      <button type="button" className="mx-2" onClick={() => this.toggleVisibleSecret()}>
        {this.state.maskInput === true ? (
          <IconEyeOff size={18} strokeWidth={2} />
        ) : (
          <IconEye size={18} strokeWidth={2} />
        )}
      </button>
    ) : null;
  };

  render() {
    return (
      <div className={`flex flex-row items-center w-full overflow-x-auto ${this.props.className}`}>
        <StyledWrapper
          ref={this.editorRef}
          className={`single-line-editor grow ${this.props.readOnly ? 'read-only' : ''}`}
          $isCompact={this.props.isCompact}
          {...(this.props['data-testid'] ? { 'data-testid': this.props['data-testid'] } : {})}
        />
        <div className="flex items-center">
          {this.secretEye(this.props.isSecret)}
        </div>
      </div>
    );
  }
}
export default SingleLineEditor;
