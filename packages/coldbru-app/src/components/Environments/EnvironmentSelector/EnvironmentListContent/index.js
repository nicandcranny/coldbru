import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconPlus, IconDownload, IconSettings, IconSearch, IconX } from '@tabler/icons';
import ToolHint from 'components/ToolHint';
import ColorBadge from 'components/ColorBadge';

const EnvironmentListContent = ({
  environments,
  hasEnvironments,
  activeEnvironmentUid,
  description,
  searchText,
  setSearchText,
  isOpen,
  autoFocusSearch = false,
  onEnvironmentSelect,
  onSettingsClick,
  onCreateClick,
  onImportClick,
  onClose
}) => {
  const optionRefs = useRef([]);
  const inputRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectableOptions = useMemo(() => {
    const environmentOptions = environments.map((env) => ({
      id: env.uid,
      type: 'environment',
      environment: env
    }));

    return [
      {
        id: 'no-environment',
        type: 'none'
      },
      ...environmentOptions,
      {
        id: 'configure',
        type: 'configure'
      }
    ];
  }, [environments]);

  const navigableIndices = useMemo(() => {
    if (searchText.trim()) {
      return environments.map((_, index) => index + 1);
    }

    return selectableOptions.map((_, index) => index);
  }, [environments, searchText, selectableOptions]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoFocusSearch || !hasEnvironments) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select?.();
  }, [autoFocusSearch, hasEnvironments, isOpen]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchText, environments]);

  useEffect(() => {
    if (highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex]);

  const moveHighlight = (direction) => {
    if (!navigableIndices.length) {
      return;
    }

    setHighlightedIndex((currentIndex) => {
      const currentNavigableIndex = navigableIndices.indexOf(currentIndex);

      if (currentNavigableIndex < 0) {
        return direction === 1 ? navigableIndices[0] : navigableIndices[navigableIndices.length - 1];
      }

      const nextNavigableIndex = (currentNavigableIndex + direction + navigableIndices.length) % navigableIndices.length;
      return navigableIndices[nextNavigableIndex];
    });
  };

  const activateHighlightedOption = () => {
    if (highlightedIndex < 0) {
      return;
    }

    const option = selectableOptions[highlightedIndex];

    if (option?.type === 'none') {
      onEnvironmentSelect(null);
      return;
    }

    if (option?.type === 'environment') {
      onEnvironmentSelect(option.environment);
      return;
    }

    if (option?.type === 'configure') {
      onSettingsClick();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === 'Enter') {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        activateHighlightedOption();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  };

  const getOptionClassName = (index, isActive = false) => {
    return `dropdown-item ${isActive ? 'dropdown-item-active' : ''} ${highlightedIndex === index ? 'dropdown-item-focused' : ''}`.trim();
  };

  const getOptionId = (id) => `environment-option-${id}`;

  return (
    <div>
      {hasEnvironments ? (
        <>
          <div className="environment-search">
            <IconSearch size={13} strokeWidth={1.5} className="environment-search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search environments..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="environment-search-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="environment-selector-listbox"
              aria-activedescendant={highlightedIndex >= 0 ? getOptionId(selectableOptions[highlightedIndex]?.id) : undefined}
            />
            {searchText ? (
              <button
                className="environment-search-clear"
                title="Clear search"
                onClick={() => setSearchText('')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <IconX size={12} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
          <div
            className="environment-list"
            role="listbox"
            id="environment-selector-listbox"
            aria-label="Environment options"
            onKeyDown={handleKeyDown}
          >
            <div
              ref={(node) => {
                optionRefs.current[0] = node;
              }}
              id={getOptionId('no-environment')}
              className={getOptionClassName(0, !activeEnvironmentUid)}
              onClick={() => onEnvironmentSelect(null)}
              onMouseEnter={() => setHighlightedIndex(0)}
              role="option"
              aria-selected={!activeEnvironmentUid}
            >
              <span>No Environment</span>
            </div>
            <ToolHint
              anchorSelect="[data-tooltip-content]"
              place="right"
              positionStrategy="fixed"
              tooltipStyle={{
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}
              delayShow={1000}
            >
              <div>
                {environments.length ? (
                  environments.map((env, index) => (
                    <div
                      key={env.uid}
                      ref={(node) => {
                        optionRefs.current[index + 1] = node;
                      }}
                      id={getOptionId(env.uid)}
                      className={getOptionClassName(index + 1, env.uid === activeEnvironmentUid)}
                      onClick={() => onEnvironmentSelect(env)}
                      onMouseEnter={() => setHighlightedIndex(index + 1)}
                      data-tooltip-content={env.name}
                      data-tooltip-hidden={env.name?.length < 90}
                      role="option"
                      aria-selected={env.uid === activeEnvironmentUid}
                    >
                      <ColorBadge color={env.color} size={8} />
                      <span className="max-w-100% truncate no-wrap">{env.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="environment-no-results">No matching environments</div>
                )}
              </div>
            </ToolHint>
            <div
              ref={(node) => {
                optionRefs.current[selectableOptions.length - 1] = node;
              }}
              id={getOptionId('configure')}
              className={`${getOptionClassName(selectableOptions.length - 1)} configure-button`}
              onClick={onSettingsClick}
              onMouseEnter={() => setHighlightedIndex(selectableOptions.length - 1)}
              role="option"
              aria-selected={false}
            >
              <IconSettings size={16} strokeWidth={1.5} />
              <span>Configure</span>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>Ready to get started?</h3>
          <p>{description}</p>
          <div className="space-y-2">
            <button onClick={onCreateClick} id="create-env">
              <IconPlus size={16} strokeWidth={1.5} />
              Create
            </button>
            <button onClick={onImportClick} id="import-env">
              <IconDownload size={16} strokeWidth={1.5} />
              Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentListContent;
