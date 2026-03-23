import React from 'react';
import { SEARCH_TYPES, MATCH_TYPES, SEARCH_CONFIG, SEARCH_PREFIXES, SEARCH_SCOPES } from '../constants';
import { normalizePath } from 'utils/common/path';

export const filterCollectionsByWorkspace = (collections = [], workspace = null) => {
  if (!workspace) {
    return [];
  }

  const workspaceCollectionPaths = new Set(
    (workspace.collections || [])
      .filter((collection) => collection?.path)
      .map((collection) => normalizePath(collection.path))
  );

  return collections.filter((collection) => {
    if (!collection) {
      return false;
    }

    if (workspace.scratchCollectionUid && collection.uid === workspace.scratchCollectionUid) {
      return true;
    }

    if (!collection.pathname) {
      return false;
    }

    return workspaceCollectionPaths.has(normalizePath(collection.pathname));
  });
};

export const normalizeQuery = (searchQuery) => {
  return searchQuery.trim().replace(/\/+/g, '/');
};

export const isValidQuery = (normalizedQuery) => {
  return normalizedQuery
    && normalizedQuery !== '/'
    && !(normalizedQuery.length === 1 && !normalizedQuery.match(/[a-zA-Z0-9]/));
};

export const highlightText = (text, searchQuery) => {
  if (!searchQuery) return text;

  try {
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="highlight">{part}</span>
      ) : part
    );
  } catch {
    return text;
  }
};

export const sortResults = (results) => {
  return results.sort((a, b) => {
    // Sort by match type priority
    const matchTypeOrder = {
      [MATCH_TYPES.COLLECTION]: 0,
      [MATCH_TYPES.ENVIRONMENT]: 1,
      [MATCH_TYPES.GLOBAL_ENVIRONMENT]: 2,
      [MATCH_TYPES.API_SPEC]: 3,
      [MATCH_TYPES.FOLDER]: 4,
      [MATCH_TYPES.REQUEST]: 5,
      [MATCH_TYPES.VARIABLE]: 6,
      [MATCH_TYPES.URL]: 7,
      [MATCH_TYPES.PATH]: 8
    };
    const aMatchType = matchTypeOrder[a.matchType] ?? 9;
    const bMatchType = matchTypeOrder[b.matchType] ?? 9;

    if (aMatchType !== bMatchType) return aMatchType - bMatchType;

    // Sort by type priority
    const typeOrder = {
      [SEARCH_TYPES.COLLECTION]: 0,
      [SEARCH_TYPES.ENVIRONMENT]: 1,
      [SEARCH_TYPES.GLOBAL_ENVIRONMENT]: 2,
      [SEARCH_TYPES.API_SPEC]: 3,
      [SEARCH_TYPES.FOLDER]: 4,
      [SEARCH_TYPES.REQUEST]: 5
    };
    const aType = typeOrder[a.type] ?? 6;
    const bType = typeOrder[b.type] ?? 6;

    if (aType !== bType) return aType - bType;

    // Finally sort alphabetically
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
};

const getResultIdentity = (result) => {
  const collectionPath = normalizePath(result?.item?.pathname || result?.collectionPathname || result?.collection?.pathname || '');
  const itemPath = normalizePath(result?.item?.pathname || result?.path || '');

  switch (result?.type) {
    case SEARCH_TYPES.COLLECTION:
      return `${SEARCH_TYPES.COLLECTION}:${collectionPath || normalizePath(result?.path || '') || result?.name}`;
    case SEARCH_TYPES.ENVIRONMENT:
      return `${SEARCH_TYPES.ENVIRONMENT}:${collectionPath || result?.collectionUid || 'unknown'}:${result?.environmentUid || result?.item?.uid || result?.name}`;
    case SEARCH_TYPES.GLOBAL_ENVIRONMENT:
      return `${SEARCH_TYPES.GLOBAL_ENVIRONMENT}:${result?.environmentUid || result?.item?.uid || result?.name}`;
    case SEARCH_TYPES.API_SPEC:
      return `${SEARCH_TYPES.API_SPEC}:${normalizePath(result?.item?.pathname || result?.path || '') || result?.item?.uid || result?.name}`;
    case SEARCH_TYPES.FOLDER:
      return `${SEARCH_TYPES.FOLDER}:${collectionPath || result?.collectionUid || 'unknown'}:${itemPath || result?.item?.uid || result?.name}`;
    case SEARCH_TYPES.REQUEST:
      return `${SEARCH_TYPES.REQUEST}:${collectionPath || result?.collectionUid || 'unknown'}:${itemPath || result?.item?.uid || result?.name}`;
    default:
      return `${result?.type || 'unknown'}:${itemPath || result?.item?.uid || result?.path || result?.name || ''}`;
  }
};

export const dedupeSearchResults = (results = []) => {
  const seen = new Set();

  return results.filter((result) => {
    const identity = getResultIdentity(result);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
};

export const getTypeLabel = (type) => {
  const baseLabels = {
    [SEARCH_TYPES.COLLECTION]: 'Collection',
    [SEARCH_TYPES.ENVIRONMENT]: 'Environment',
    [SEARCH_TYPES.GLOBAL_ENVIRONMENT]: 'Global Environment',
    [SEARCH_TYPES.API_SPEC]: 'API Spec',
    [SEARCH_TYPES.FOLDER]: 'Folder'
  };

  return baseLabels[type] || '';
};

export const getItemPath = (item, collection, findParentItemInCollection) => {
  const pathParts = [];
  let currentItem = item;
  let depth = 0;
  const maxDepth = SEARCH_CONFIG.MAX_DEPTH;

  while (currentItem && depth < maxDepth) {
    pathParts.unshift(currentItem.name);
    const parent = findParentItemInCollection(collection, currentItem.uid);
    if (parent) {
      currentItem = parent;
      depth++;
    } else {
      break;
    }
  }

  pathParts.unshift(collection.name);
  return pathParts.join('/');
};

export const parseSearchQuery = (searchQuery = '') => {
  const trimmedStartQuery = searchQuery.trimStart();
  const prefixMatch = trimmedStartQuery.match(/^([a-z]+):(.*)$/i);

  if (!prefixMatch) {
    const normalizedQuery = normalizeQuery(searchQuery);
    return {
      scope: SEARCH_SCOPES.ALL,
      normalizedQuery,
      searchText: normalizedQuery,
      searchTerms: normalizedQuery.toLowerCase().split(/[\s\/]+/).filter(Boolean),
      matchedPrefix: null,
      rawPrefix: null,
      hasRecognizedPrefix: false
    };
  }

  const [, rawPrefix, rawSearchText = ''] = prefixMatch;
  const matchedPrefix = `${rawPrefix.toLowerCase()}:`;
  const scope = SEARCH_PREFIXES[rawPrefix.toLowerCase()];

  if (!scope) {
    const normalizedQuery = normalizeQuery(searchQuery);
    return {
      scope: SEARCH_SCOPES.ALL,
      normalizedQuery,
      searchText: normalizedQuery,
      searchTerms: normalizedQuery.toLowerCase().split(/[\s\/]+/).filter(Boolean),
      matchedPrefix: null,
      rawPrefix: `${rawPrefix}:`,
      hasRecognizedPrefix: false
    };
  }

  const normalizedQuery = normalizeQuery(rawSearchText);

  return {
    scope,
    normalizedQuery,
    searchText: rawSearchText,
    searchTerms: normalizedQuery.toLowerCase().split(/[\s\/]+/).filter(Boolean),
    matchedPrefix,
    rawPrefix: `${rawPrefix}:`,
    hasRecognizedPrefix: true
  };
};

const getEnvironmentVariableMatch = (variables = [], searchTerms = []) => {
  return variables.find((variable) => {
    const variableName = variable?.name?.toLowerCase() || '';
    const variableValue = typeof variable?.value === 'string' && !variable?.secret
      ? variable.value.toLowerCase()
      : '';

    return searchTerms.every((term) => variableName.includes(term) || variableValue.includes(term));
  });
};

export const searchCollectionEnvironments = (collections = [], searchTerms = []) => {
  return collections.reduce((results, collection) => {
    const environments = collection?.environments || [];
    environments.forEach((environment) => {
      const environmentName = environment?.name?.toLowerCase() || '';
      const nameMatch = searchTerms.every((term) => environmentName.includes(term));
      const matchingVariable = getEnvironmentVariableMatch(environment?.variables, searchTerms);

      if (!nameMatch && !matchingVariable) {
        return;
      }

      results.push({
        type: SEARCH_TYPES.ENVIRONMENT,
        item: environment,
        name: environment?.name || 'Unnamed Environment',
        path: `${collection?.name || 'Collection'}/Environments`,
        description: matchingVariable?.name ? `Variable: ${matchingVariable.name}` : `Collection: ${collection?.name || 'Unknown'}`,
        matchType: nameMatch ? MATCH_TYPES.ENVIRONMENT : MATCH_TYPES.VARIABLE,
        collectionUid: collection?.uid,
        environmentUid: environment?.uid
      });
    });

    return results;
  }, []);
};

export const searchGlobalEnvironments = (globalEnvironments = [], searchTerms = []) => {
  return globalEnvironments.reduce((results, environment) => {
    const environmentName = environment?.name?.toLowerCase() || '';
    const nameMatch = searchTerms.every((term) => environmentName.includes(term));
    const matchingVariable = getEnvironmentVariableMatch(environment?.variables, searchTerms);

    if (!nameMatch && !matchingVariable) {
      return results;
    }

    results.push({
      type: SEARCH_TYPES.GLOBAL_ENVIRONMENT,
      item: environment,
      name: environment?.name || 'Unnamed Global Environment',
      path: 'Global Environments',
      description: matchingVariable?.name ? `Variable: ${matchingVariable.name}` : 'Workspace global environment',
      matchType: nameMatch ? MATCH_TYPES.GLOBAL_ENVIRONMENT : MATCH_TYPES.VARIABLE,
      environmentUid: environment?.uid
    });

    return results;
  }, []);
};

export const filterApiSpecsByWorkspace = (apiSpecs = [], workspace = null) => {
  if (!workspace) {
    return [];
  }

  const workspaceApiSpecPaths = new Set(
    (workspace.apiSpecs || [])
      .filter((apiSpec) => apiSpec?.path)
      .map((apiSpec) => normalizePath(apiSpec.path))
  );

  return apiSpecs.filter((apiSpec) => {
    if (!apiSpec?.pathname) {
      return false;
    }

    return workspaceApiSpecPaths.has(normalizePath(apiSpec.pathname));
  });
};
