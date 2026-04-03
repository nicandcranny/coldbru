import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'styled-components';
import {
  applyVariableSuggestion,
  getVariableSuggestions,
  tokenizeHighlightedValue
} from 'utils/common/nativeAutocomplete';

const NativeAutocompleteInput = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = '',
  className = '',
  inputClassName = '',
  type = 'text',
  readOnly = false,
  list,
  variableHints = [],
  variableContext = {}
}) => {
  const theme = useTheme();
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestionState, setSuggestionState] = useState(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const updateSuggestions = useCallback((nextValue, cursorPosition) => {
    if (!variableHints.length) {
      setSuggestionState(null);
      setActiveIndex(0);
      return;
    }

    const nextState = getVariableSuggestions({
      value: nextValue,
      cursorPosition,
      variableHints
    });
    setSuggestionState(nextState);
    setActiveIndex(0);
  }, [variableHints]);

  useEffect(() => {
    const activeElement = inputRef.current;
    if (!activeElement || activeElement !== document.activeElement) {
      setSuggestionState(null);
      return;
    }

    updateSuggestions(value || '', activeElement.selectionStart ?? String(value || '').length);
  }, [value, updateSuggestions]);

  const suggestions = useMemo(() => suggestionState?.suggestions || [], [suggestionState]);
  const highlightedTokens = useMemo(() => tokenizeHighlightedValue({
    value: value || '',
    allVariables: variableContext
  }), [value, variableContext]);
  const shouldShowOverlay = type === 'text' && !readOnly && highlightedTokens.some((token) => token.type !== 'text');

  const updateMenuPosition = useCallback(() => {
    const inputElement = inputRef.current;
    if (!inputElement || !suggestions.length) {
      setMenuStyle(null);
      return;
    }

    const rect = inputElement.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
      zIndex: 9999
    });
  }, [suggestions.length]);

  useEffect(() => {
    if (!suggestions.length) {
      setMenuStyle(null);
      return undefined;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [suggestions.length, updateMenuPosition]);

  const applySuggestion = useCallback((suggestion) => {
    if (!suggestionState) {
      return;
    }

    const inputElement = inputRef.current;
    const nextValue = applyVariableSuggestion({
      value: value || '',
      replaceFrom: suggestionState.replaceFrom,
      replaceTo: suggestionState.replaceTo,
      suggestion
    });

    if (inputElement) {
      inputElement.focus();
      inputElement.setSelectionRange(suggestionState.replaceFrom, suggestionState.replaceTo);

      const nativeInsertApplied = document.execCommand?.('insertText', false, suggestion);

      if (!nativeInsertApplied) {
        inputElement.setRangeText(suggestion, suggestionState.replaceFrom, suggestionState.replaceTo, 'end');

        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      }
    } else {
      onChange(nextValue);
    }

    setSuggestionState(null);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      const nextCursorPosition = suggestionState.replaceFrom + suggestion.length;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
      updateSuggestions(nextValue, nextCursorPosition);
    });
  }, [onChange, suggestionState, updateSuggestions, value]);

  const handleChange = useCallback((event) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    updateSuggestions(nextValue, event.target.selectionStart ?? nextValue.length);
  }, [onChange, updateSuggestions]);

  const handleBlur = useCallback((event) => {
    requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) {
        setSuggestionState(null);
      }
    });
    onBlur?.(event);
  }, [onBlur]);

  const handleKeyDown = useCallback((event) => {
    if (suggestions.length) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % suggestions.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        return;
      }

      if (event.key === 'Escape') {
        setSuggestionState(null);
        setActiveIndex(0);
        return;
      }

      if ((event.key === 'Enter' || event.key === 'Tab') && suggestions[activeIndex]) {
        event.preventDefault();
        applySuggestion(suggestions[activeIndex]);
        return;
      }
    }

    onKeyDown?.(event);
  }, [activeIndex, applySuggestion, onKeyDown, suggestions]);

  return (
    <div className={`relative w-full ${className}`}>
      {shouldShowOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre"
          style={{
            color: theme.text,
            fontSize: theme.font.size.base,
            lineHeight: 'inherit',
            fontFamily: 'inherit'
          }}
        >
          {highlightedTokens.map((token, index) => {
            let color = theme.text;
            if (token.type === 'valid') {
              color = theme.codemirror.variable.valid;
            } else if (token.type === 'invalid') {
              color = theme.codemirror.variable.invalid;
            } else if (token.type === 'prompt') {
              color = theme.codemirror.variable.prompt;
            }

            return (
              <span key={`${token.type}-${index}`} style={{ color }}>
                {token.text}
              </span>
            );
          })}
        </div>
      ) : null}
      <input
        ref={inputRef}
        type={type}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        className={inputClassName}
        value={value || ''}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        list={list}
        style={shouldShowOverlay ? { color: 'transparent', caretColor: theme.text, position: 'relative', zIndex: 1 } : undefined}
      />
      {suggestions.length && menuStyle
        ? createPortal(
            <div
              style={{
                ...menuStyle,
                background: theme.dropdown.bg,
                border: theme.dropdown.border !== 'none' ? `1px solid ${theme.dropdown.border}` : 'none',
                boxShadow: theme.dropdown.shadow !== 'none' ? theme.dropdown.shadow : 'none',
                borderRadius: theme.border.radius.base,
                padding: '0.25rem'
              }}
              className="max-h-48 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm"
                  style={{
                    color: theme.dropdown.color,
                    borderRadius: theme.border.radius.base,
                    background: index === activeIndex ? theme.sidebar.bg : 'transparent'
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applySuggestion(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default NativeAutocompleteInput;
