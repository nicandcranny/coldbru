import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconSearch,
  IconX,
  IconFolder,
  IconBox,
  IconDatabase,
  IconFileText,
  IconWorld
} from '@tabler/icons';
import { flattenItems, isItemARequest, isItemAFolder, findParentItemInCollection } from 'utils/collections';
import { addTab, focusTab, updateTab } from 'providers/ReduxStore/slices/tabs';
import { toggleCollectionItem, toggleCollection } from 'providers/ReduxStore/slices/collections';
import { mountCollection, selectEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { openApiSpecTab } from 'providers/ReduxStore/slices/apiSpec';
import { getDefaultRequestPaneTab } from 'utils/collections';
import { openSidebarSection } from 'utils/sidebar';
import {
  parseSearchQuery,
  isValidQuery,
  highlightText,
  filterCollectionsByWorkspace,
  filterApiSpecsByWorkspace,
  sortResults,
  dedupeSearchResults,
  getTypeLabel,
  getItemPath,
  searchGlobalEnvironments,
  searchCollectionEnvironments
} from './utils/searchUtils';
import {
  SEARCH_TYPES,
  MATCH_TYPES,
  SEARCH_CONFIG,
  PREFIX_HINTS,
  SEARCH_SCOPES
} from './constants';
import StyledWrapper from './StyledWrapper';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const dispatch = useDispatch();

  const collections = useSelector((state) => state.collections.collections);
  const apiSpecs = useSelector((state) => state.apiSpec.apiSpecs);
  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments);
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const activeWorkspace = workspaces.find((workspace) => workspace.uid === activeWorkspaceUid);
  const scopedCollections = filterCollectionsByWorkspace(collections, activeWorkspace);
  const scopedApiSpecs = filterApiSpecsByWorkspace(apiSpecs, activeWorkspace);

  const createCollectionResults = useCallback(() => {
    return scopedCollections.map((collection) => ({
      type: SEARCH_TYPES.COLLECTION,
      item: collection,
      name: collection.name,
      path: collection.name,
      matchType: MATCH_TYPES.COLLECTION,
      collectionUid: collection.uid
    }));
  }, [scopedCollections]);

  const createRequestResults = useCallback((enablePathMatch = false) => {
    const requestResults = [];

    scopedCollections.forEach((collection) => {
      const flattenedItems = flattenItems(collection.items);
      flattenedItems.forEach((item) => {
        if (!isItemARequest(item)) {
          return;
        }

        const itemPath = getItemPath(item, collection, findParentItemInCollection);
        const isGrpcRequest = item.request?.type === 'grpc';
        let method = item.request?.method || '';

        if (isGrpcRequest) {
          const methodType = item.request?.methodType || 'UNARY';
          method = methodType.toLowerCase().replace(/[_]/g, '-');
        }

        requestResults.push({
          type: SEARCH_TYPES.REQUEST,
          item,
          name: item.name,
          path: itemPath,
          matchType: enablePathMatch ? MATCH_TYPES.PATH : MATCH_TYPES.REQUEST,
          method,
          collectionUid: collection.uid
        });
      });
    });

    return requestResults;
  }, [scopedCollections]);

  const createEnvironmentResults = useCallback(() => {
    return [
      ...searchCollectionEnvironments(scopedCollections),
      ...searchGlobalEnvironments(globalEnvironments)
    ];
  }, [scopedCollections, globalEnvironments]);

  const createApiSpecResults = useCallback(() => {
    return scopedApiSpecs.map((apiSpec) => ({
      type: SEARCH_TYPES.API_SPEC,
      item: apiSpec,
      name: apiSpec.name,
      path: apiSpec.pathname,
      matchType: MATCH_TYPES.API_SPEC
    }));
  }, [scopedApiSpecs]);

  const searchInCollections = useCallback((searchTerms, enablePathMatch, scope) => {
    const scopedResults = [];

    if (scope === SEARCH_SCOPES.COLLECTION && !searchTerms.length) {
      return createCollectionResults();
    }

    if (scope === SEARCH_SCOPES.REQUEST && !searchTerms.length) {
      return createRequestResults(enablePathMatch);
    }

    if (scope === SEARCH_SCOPES.ENVIRONMENT && !searchTerms.length) {
      return createEnvironmentResults();
    }

    if (scope === SEARCH_SCOPES.API_SPEC && !searchTerms.length) {
      return createApiSpecResults();
    }

    if (!searchTerms.length) {
      return [];
    }

    if (scope === SEARCH_SCOPES.ALL || scope === SEARCH_SCOPES.COLLECTION) {
      scopedCollections.forEach((collection) => {
        if (searchTerms.every((term) => collection.name.toLowerCase().includes(term))) {
          scopedResults.push({
            type: SEARCH_TYPES.COLLECTION,
            item: collection,
            name: collection.name,
            path: collection.name,
            matchType: MATCH_TYPES.COLLECTION,
            collectionUid: collection.uid
          });
        }
      });
    }

    if (scope === SEARCH_SCOPES.COLLECTION) {
      return scopedResults;
    }

    if (scope === SEARCH_SCOPES.ALL || scope === SEARCH_SCOPES.REQUEST) {
      scopedCollections.forEach((collection) => {
        const flattenedItems = flattenItems(collection.items);
        flattenedItems.forEach((item) => {
          const itemPath = getItemPath(item, collection, findParentItemInCollection);
          const itemPathLower = itemPath.toLowerCase();

          if (isItemARequest(item)) {
            const nameMatch = searchTerms.every((term) => (item.name || '').toLowerCase().includes(term));
            const urlMatch = searchTerms.every((term) => (item.request?.url || '').toLowerCase().includes(term));
            const pathMatch = enablePathMatch && searchTerms.every((term) => itemPathLower.includes(term));

            if (nameMatch || urlMatch || pathMatch) {
              const isGrpcRequest = item.request?.type === 'grpc';
              let method = item.request?.method || '';

              if (isGrpcRequest) {
                const methodType = item.request?.methodType || 'UNARY';
                method = methodType.toLowerCase().replace(/[_]/g, '-');
              }

              scopedResults.push({
                type: SEARCH_TYPES.REQUEST,
                item,
                name: item.name,
                path: itemPath,
                matchType: nameMatch ? MATCH_TYPES.REQUEST : urlMatch ? MATCH_TYPES.URL : MATCH_TYPES.PATH,
                method,
                collectionUid: collection.uid
              });
            }

            return;
          }

          if (scope === SEARCH_SCOPES.ALL && isItemAFolder(item)) {
            const nameMatch = searchTerms.every((term) => item.name.toLowerCase().includes(term));
            const pathMatch = enablePathMatch && searchTerms.every((term) => itemPathLower.includes(term));

            if (nameMatch || pathMatch) {
              scopedResults.push({
                type: SEARCH_TYPES.FOLDER,
                item,
                name: item.name,
                path: itemPath,
                matchType: nameMatch ? MATCH_TYPES.FOLDER : MATCH_TYPES.PATH,
                collectionUid: collection.uid
              });
            }
          }
        });
      });
    }

    if (scope === SEARCH_SCOPES.REQUEST) {
      return scopedResults;
    }

    if (scope === SEARCH_SCOPES.ALL || scope === SEARCH_SCOPES.API_SPEC) {
      scopedApiSpecs.forEach((apiSpec) => {
        const name = apiSpec?.name?.toLowerCase() || '';
        const pathname = apiSpec?.pathname?.toLowerCase() || '';
        const nameMatch = searchTerms.every((term) => name.includes(term));
        const pathMatch = searchTerms.every((term) => pathname.includes(term));

        if (nameMatch || pathMatch) {
          scopedResults.push({
            type: SEARCH_TYPES.API_SPEC,
            item: apiSpec,
            name: apiSpec.name,
            path: apiSpec.pathname,
            matchType: nameMatch ? MATCH_TYPES.API_SPEC : MATCH_TYPES.PATH
          });
        }
      });
    }

    if (scope === SEARCH_SCOPES.API_SPEC) {
      return scopedResults;
    }

    if (scope === SEARCH_SCOPES.ALL || scope === SEARCH_SCOPES.ENVIRONMENT) {
      scopedResults.push(...searchCollectionEnvironments(scopedCollections, searchTerms));
      scopedResults.push(...searchGlobalEnvironments(globalEnvironments, searchTerms));
    }

    return scopedResults;
  }, [scopedCollections, scopedApiSpecs, globalEnvironments, createCollectionResults, createEnvironmentResults, createRequestResults, createApiSpecResults]);

  const performSearch = useCallback((searchQuery) => {
    const { scope, normalizedQuery, searchTerms } = parseSearchQuery(searchQuery);

    if (!normalizedQuery && scope === SEARCH_SCOPES.ALL) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    if (normalizedQuery && !isValidQuery(normalizedQuery)) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const enablePathMatch = normalizedQuery.includes('/');
    const sortedResults = dedupeSearchResults(sortResults(searchInCollections(searchTerms, enablePathMatch, scope)));

    setResults(sortedResults);
    setSelectedIndex(0);
  }, [searchInCollections]);

  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, SEARCH_CONFIG.DEBOUNCE_DELAY);
  }, [performSearch]);

  const ensureCollectionIsMounted = (collection) => {
    if (!collection || collection.mountStatus === 'mounted') return;
    dispatch(mountCollection({
      collectionUid: collection.uid,
      collectionPathname: collection.pathname,
      brunoConfig: collection.brunoConfig
    }));
  };

  const openSidebarSectionAfterMount = (sectionId, detail = {}) => {
    openSidebarSection(sectionId);

    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        openSidebarSection(sectionId, detail);
      });
    });
  };

  const expandItemPath = (result) => {
    const collection = collections.find((c) => c.uid === result.collectionUid);
    if (!collection) return;

    ensureCollectionIsMounted(collection);

    if (collection.collapsed) {
      dispatch(toggleCollection(collection.uid));
    }

    let currentItem = result.type === SEARCH_TYPES.FOLDER
      ? result.item
      : findParentItemInCollection(collection, result.item.uid);

    while (currentItem?.type === 'folder') {
      if (currentItem.collapsed) {
        dispatch(toggleCollectionItem({ collectionUid: collection.uid, itemUid: currentItem.uid }));
      }
      currentItem = findParentItemInCollection(collection, currentItem.uid);
    }
  };

  const handleResultSelection = (result) => {
    if (result.type === SEARCH_TYPES.GLOBAL_ENVIRONMENT) {
      const scratchCollectionUid = activeWorkspace?.scratchCollectionUid;
      const globalEnvironmentTabUid = scratchCollectionUid
        ? `${scratchCollectionUid}-global-environment-settings`
        : null;

      if (result.environmentUid && globalEnvironmentTabUid && scratchCollectionUid) {
        const existingTab = tabs.find((tab) => tab.uid === globalEnvironmentTabUid);
        const environment = globalEnvironments.find((item) => item.uid === result.environmentUid);

        if (existingTab) {
          dispatch(updateTab({
            uid: globalEnvironmentTabUid,
            environmentUid: result.environmentUid,
            tabName: environment?.name
          }));
          dispatch(focusTab({ uid: globalEnvironmentTabUid }));
        } else {
          dispatch(addTab({
            uid: globalEnvironmentTabUid,
            collectionUid: scratchCollectionUid,
            type: 'global-environment-settings',
            environmentUid: result.environmentUid,
            tabName: environment?.name
          }));
        }
      }

      if (result.environmentUid) {
        openSidebarSectionAfterMount('global-variables', {
          focusEnvironmentUid: result.environmentUid
        });
      }

      onClose();
      return;
    }

    if (result.type === SEARCH_TYPES.ENVIRONMENT) {
      const existingTab = tabs.find((tab) => tab.collectionUid === result.collectionUid && tab.type === 'environment-settings');

      if (result.environmentUid && result.collectionUid) {
        dispatch(selectEnvironment(result.environmentUid, result.collectionUid));
      }

      if (existingTab) {
        dispatch(focusTab({ uid: existingTab.uid }));
      } else {
        dispatch(addTab({
          uid: `${result.collectionUid}-environment-settings`,
          collectionUid: result.collectionUid,
          type: 'environment-settings'
        }));
      }

      onClose();
      return;
    }

    if (result.type === SEARCH_TYPES.API_SPEC) {
      dispatch(openApiSpecTab({ uid: result.item.uid }));
      openSidebarSectionAfterMount('api-specs');
      onClose();
      return;
    }

    const targetCollection = collections.find((c) => c.uid === result.collectionUid);
    ensureCollectionIsMounted(targetCollection);
    expandItemPath(result);

    if (result.type === SEARCH_TYPES.REQUEST) {
      const existingTab = tabs.find((tab) => tab.uid === result.item.uid);

      if (existingTab) {
        dispatch(focusTab({ uid: result.item.uid }));
      } else {
        dispatch(addTab({
          uid: result.item.uid,
          collectionUid: result.collectionUid,
          requestPaneTab: getDefaultRequestPaneTab(result.item),
          type: 'request'
        }));
      }
    } else if (result.type === SEARCH_TYPES.FOLDER) {
      dispatch(addTab({
        uid: result.item.uid,
        collectionUid: result.collectionUid,
        type: 'folder-settings'
      }));
    } else if (result.type === SEARCH_TYPES.COLLECTION) {
      dispatch(addTab({
        uid: result.item.uid,
        collectionUid: result.collectionUid,
        type: 'collection-settings'
      }));
    }

    openSidebarSectionAfterMount('collections');

    onClose();
  };

  const handleQueryChange = (e) => {
    const nextValue = e.target.value;
    const { matchedPrefix } = parseSearchQuery(query);
    const nextQuery = matchedPrefix ? `${matchedPrefix}${nextValue}` : nextValue;

    setQuery(nextQuery);

    if (nextQuery.trim()) {
      debouncedSearch(nextQuery);
      return;
    }

    performSearch(nextQuery);
  };

  const clearSearch = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setQuery('');
    setResults([]);
  };

  const handleKeyNavigation = (e) => {
    if (e.key === 'Backspace') {
      const input = inputRef.current;
      const { matchedPrefix, searchText } = parseSearchQuery(query);

      if (matchedPrefix && !searchText && input?.selectionStart === 0 && input?.selectionEnd === 0) {
        e.preventDefault();
        const nextQuery = query.slice(0, -1);
        setQuery(nextQuery);
        performSearch(nextQuery);
        return;
      }
    }

    const handlers = {
      ArrowDown: () => {
        e.preventDefault();
        setSelectedIndex((prev) => prev < results.length - 1 ? prev + 1 : 0);
      },
      ArrowUp: () => {
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : results.length - 1);
      },
      Enter: () => {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelection(results[selectedIndex]);
        }
      },
      Escape: () => {
        e.preventDefault();
        onClose();
      },
      PageDown: () => {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 5, results.length - 1));
      },
      PageUp: () => {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 5, 0));
      },
      Home: () => {
        e.preventDefault();
        setSelectedIndex(0);
      },
      End: () => {
        e.preventDefault();
        setSelectedIndex(results.length - 1);
      }
    };

    const handler = handlers[e.key];
    if (handler) handler();
  };

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => inputRef.current?.focus(), SEARCH_CONFIG.FOCUS_DELAY);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);

      return () => clearTimeout(timeoutId);
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      selectedElement?.scrollIntoView({
        behavior: SEARCH_CONFIG.SCROLL_BEHAVIOR,
        block: SEARCH_CONFIG.SCROLL_BLOCK
      });
    }
  }, [selectedIndex, results]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const getResultIcon = (type) => {
    const iconMap = {
      [SEARCH_TYPES.COLLECTION]: IconBox,
      [SEARCH_TYPES.ENVIRONMENT]: IconDatabase,
      [SEARCH_TYPES.GLOBAL_ENVIRONMENT]: IconWorld,
      [SEARCH_TYPES.API_SPEC]: IconFileText,
      [SEARCH_TYPES.FOLDER]: IconFolder,
      [SEARCH_TYPES.REQUEST]: IconFileText
    };
    const IconComponent = iconMap[type] || IconFileText;
    return <IconComponent size={18} stroke={1.5} />;
  };

  if (!isOpen) return null;

  const { matchedPrefix, searchText } = parseSearchQuery(query);
  const activeSearchText = matchedPrefix ? searchText : query;

  return (
    <StyledWrapper>
      <div
        className="command-k-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        aria-describedby="search-modal-description"
      >
        <div className="command-k-modal" onClick={(e) => e.stopPropagation()}>
          <h1 id="search-modal-title" className="sr-only">Global Search</h1>
          <p id="search-modal-description" className="sr-only">
            Search through collections, API specs, environments, requests, and folders. Use arrow keys to navigate results and Enter to select.
          </p>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {results.length > 0 && query
              ? `${results.length} result${results.length === 1 ? '' : 's'} found`
              : query && results.length === 0
                ? 'No results found'
                : ''}
          </div>
          <div className="command-k-header">
            <div className="search-input-container">
              <IconSearch size={20} className="search-icon" aria-hidden="true" />
              {matchedPrefix && (
                <span className="search-prefix-chip" aria-hidden="true">
                  {matchedPrefix}
                </span>
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder={matchedPrefix ? 'Type to refine this scope...' : 'Try col:, spec:, env:, or req:'}
                value={activeSearchText}
                onChange={handleQueryChange}
                onKeyDown={handleKeyNavigation}
                className="search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                aria-label="Search collections, API specs, environments, requests, or folders"
                aria-expanded={results.length > 0}
                aria-controls="search-results"
                aria-activedescendant={results.length > 0 ? `search-result-${selectedIndex}` : undefined}
                role="combobox"
                aria-autocomplete="list"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="clear-button"
                  aria-label="Clear search query"
                  type="button"
                >
                  <IconX size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div
            className="command-k-results"
            ref={resultsRef}
            id="search-results"
            role="listbox"
            aria-label="Search results"
          >
            {results.length === 0 && query ? (
              <div className="no-results">
                <p>
                  No results found for "{query}".
                  <br />
                  <span className="block mt-2">Try a different prefix or refine the search text.</span>
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-copy">
                  <div className="empty-state-title">Search anything</div>
                  <div className="empty-state-description">
                    Or narrow the search with a prefix when you want a specific result type.
                  </div>
                </div>
                <div className="prefix-hints" aria-label="Search prefixes">
                  {PREFIX_HINTS.map((hint) => (
                    <div key={hint.prefix} className="prefix-hint">
                      <span className="prefix-hint-code">{hint.prefix}</span>
                      <span className="prefix-hint-label">{hint.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              results.map((result, index) => {
                const isSelected = index === selectedIndex;
                const typeLabel = getTypeLabel(result.type);

                return (
                  <div
                    key={`${result.type}-${result.item.id || result.item.uid}-${index}`}
                    id={`search-result-${index}`}
                    className={`result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleResultSelection(result)}
                    data-selected={isSelected}
                    data-type={result.type}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${result.name}, ${typeLabel || result.type}${result.method ? `, ${result.method}` : ''}`}
                    tabIndex={-1}
                  >
                    <div className="result-icon">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="result-content">
                      <div className="result-info">
                        <div className="result-name">
                          {highlightText(result.name, activeSearchText)}
                        </div>
                        <div className="result-path">
                          {result.type === SEARCH_TYPES.GLOBAL_ENVIRONMENT || result.type === SEARCH_TYPES.ENVIRONMENT
                            ? highlightText(result.description || result.path, activeSearchText)
                            : result.type === SEARCH_TYPES.REQUEST
                              ? highlightText(result.item.request?.url || '', activeSearchText)
                              : highlightText(result.path, activeSearchText)}
                        </div>
                      </div>
                      <div className="result-badges">
                        {result.type === SEARCH_TYPES.REQUEST && result.method && (
                          <span
                            className={`method-badge ${result.method.toLowerCase()}`}
                            aria-label={`HTTP method ${result.method.toUpperCase().replace(/-/g, ' ')}`}
                          >
                            {result.method.toUpperCase().replace(/-/g, ' ')}
                          </span>
                        )}
                        {typeLabel && (
                          <div className="result-type" aria-label={`Item type ${typeLabel}`}>
                            {typeLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="command-k-footer">
            <div className="keyboard-hints" role="region" aria-label="Keyboard shortcuts">
              <span aria-label="Use up and down arrows to navigate">
                <span className="keycap" aria-hidden="true">↑</span>
                <span className="keycap" aria-hidden="true">↓</span>
                <span className="hint-label">to navigate</span>
              </span>
              <span aria-label="Press Enter to select">
                <span className="keycap" aria-hidden="true">↵</span>
                <span className="hint-label">to select</span>
              </span>
              <span aria-label="Press Escape to close">
                <span className="keycap" aria-hidden="true">esc</span>
                <span className="hint-label">to close</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default GlobalSearchModal;
