export const SEARCH_TYPES = {
  COLLECTION: 'collection',
  ENVIRONMENT: 'environment',
  GLOBAL_ENVIRONMENT: 'global-environment',
  FOLDER: 'folder',
  REQUEST: 'request'
};

export const MATCH_TYPES = {
  COLLECTION: 'collection',
  ENVIRONMENT: 'environment',
  GLOBAL_ENVIRONMENT: 'global-environment',
  FOLDER: 'folder',
  REQUEST: 'request',
  VARIABLE: 'variable',
  URL: 'url',
  PATH: 'path'
};

export const SEARCH_CONFIG = {
  MAX_DEPTH: 20,
  FOCUS_DELAY: 100,
  SCROLL_BEHAVIOR: 'smooth',
  SCROLL_BLOCK: 'nearest',
  DEBOUNCE_DELAY: 300
};

export const SEARCH_SCOPES = {
  ALL: 'all',
  COLLECTION: 'collection',
  ENVIRONMENT: 'environment',
  REQUEST: 'request'
};

export const SEARCH_PREFIXES = {
  col: SEARCH_SCOPES.COLLECTION,
  env: SEARCH_SCOPES.ENVIRONMENT,
  req: SEARCH_SCOPES.REQUEST
};

export const PREFIX_HINTS = [
  { prefix: 'col:', label: 'Collections' },
  { prefix: 'env:', label: 'All environments' },
  { prefix: 'req:', label: 'Requests' }
];
