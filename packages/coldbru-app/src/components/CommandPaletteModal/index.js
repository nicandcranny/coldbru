import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconCommand, IconSearch, IconSettings, IconPlus, IconUpload, IconVariable } from '@tabler/icons';
import { useDispatch, useSelector } from 'react-redux';
import Portal from 'components/Portal';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import StyledWrapper from './StyledWrapper';

const COMMANDS = [
  {
    id: 'open-collection-environment-picker',
    title: 'Open Collection Environment Picker',
    description: 'Open existing collection environment dropdown.',
    keywords: ['env', 'environment', 'switch', 'collection', 'variables'],
    icon: IconVariable,
    run: () => {
      window.dispatchEvent(new CustomEvent('environment-selector-open', {
        detail: {
          preferredTab: 'collection'
        }
      }));
    }
  },
  {
    id: 'open-global-environment-picker',
    title: 'Open Global Environment Picker',
    description: 'Open existing global environment dropdown.',
    keywords: ['env', 'environment', 'switch', 'global', 'variables'],
    icon: IconVariable,
    run: () => {
      window.dispatchEvent(new CustomEvent('environment-selector-open', {
        detail: {
          preferredTab: 'global'
        }
      }));
    }
  },
  {
    id: 'open-global-search',
    title: 'Open Global Search',
    description: 'Search collections, requests, environments, and API specs.',
    keywords: ['search', 'find', 'request', 'collection', 'spec'],
    icon: IconSearch,
    run: () => {
      window.dispatchEvent(new CustomEvent('global-search-open'));
    }
  },
  {
    id: 'new-request',
    title: 'New Request',
    description: 'Create request in current collection.',
    keywords: ['request', 'new', 'create', 'api'],
    icon: IconPlus,
    run: () => {
      window.dispatchEvent(new CustomEvent('new-request-open'));
    }
  },
  {
    id: 'import-collection',
    title: 'Import Collection',
    description: 'Import Postman, OpenAPI, Insomnia, or Bruno files.',
    keywords: ['import', 'collection', 'postman', 'openapi', 'insomnia'],
    icon: IconUpload,
    run: () => {
      window.dispatchEvent(new CustomEvent('import-collection-open'));
    }
  }
];

const CommandPaletteModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const activeWorkspace = workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null;
  const activeTab = tabs.find((tab) => tab.uid === activeTabUid) || null;
  const preferenceCollectionUid = activeTab?.collectionUid || activeWorkspace?.scratchCollectionUid || null;

  const commands = useMemo(() => {
    return [
      ...COMMANDS,
      {
        id: 'open-preferences',
        title: 'Open Preferences',
        description: 'Manage keybindings, themes, and app settings.',
        keywords: ['preferences', 'settings', 'config', 'keybindings'],
        icon: IconSettings,
        run: () => {
          dispatch(addTab({
            type: 'preferences',
            uid: preferenceCollectionUid ? `${preferenceCollectionUid}-preferences` : 'preferences',
            collectionUid: preferenceCollectionUid
          }));
        }
      }
    ];
  }, [dispatch, preferenceCollectionUid]);

  const filteredCommands = useMemo(() => {
    const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    if (!searchTerms.length) {
      return commands;
    }

    return commands.filter((command) => {
      const haystack = `${command.title} ${command.description} ${(command.keywords || []).join(' ')}`.toLowerCase();
      return searchTerms.every((term) => haystack.includes(term));
    });
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuery('');
    setSelectedIndex(0);

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!filteredCommands.length || !resultsRef.current) {
      return;
    }

    resultsRef.current.children[selectedIndex]?.scrollIntoView({
      block: 'nearest'
    });
  }, [filteredCommands.length, selectedIndex]);

  const runCommand = (command) => {
    if (!command) {
      return;
    }

    onClose();
    command.run();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (current < filteredCommands.length - 1 ? current + 1 : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (current > 0 ? current - 1 : filteredCommands.length - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(filteredCommands[selectedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <StyledWrapper>
        <div className="command-palette-overlay" onClick={onClose}>
          <div
            className="command-palette-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
          >
            <div className="command-palette-header">
              <div className="command-palette-title-row">
                <IconCommand size={18} strokeWidth={1.5} />
                <h1 id="command-palette-title">Command Palette</h1>
              </div>
              <div className="command-palette-search">
                <IconSearch size={16} strokeWidth={1.5} className="search-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type command name..."
                  aria-label="Command palette search"
                />
              </div>
            </div>

            <div className="command-palette-results" ref={resultsRef} role="listbox" aria-label="Command results">
              {filteredCommands.length ? (
                filteredCommands.map((command, index) => {
                  const Icon = command.icon;

                  return (
                    <button
                      key={command.id}
                      className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => runCommand(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <span className="command-item-icon">
                        <Icon size={18} strokeWidth={1.5} />
                      </span>
                      <span className="command-item-copy">
                        <span className="command-item-title">{command.title}</span>
                        <span className="command-item-description">{command.description}</span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="command-palette-empty">
                  No commands found for "{query}".
                </div>
              )}
            </div>
          </div>
        </div>
      </StyledWrapper>
    </Portal>
  );
};

export default CommandPaletteModal;
