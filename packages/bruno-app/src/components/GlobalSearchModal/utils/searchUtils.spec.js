const { describe, it, expect } = require('@jest/globals');
const { MATCH_TYPES, SEARCH_SCOPES, SEARCH_TYPES } = require('../constants');
const {
  dedupeSearchResults,
  filterApiSpecsByWorkspace,
  filterCollectionsByWorkspace,
  parseSearchQuery,
  searchCollectionEnvironments,
  searchGlobalEnvironments
} = require('./searchUtils');

describe('global search query parsing', () => {
  it('recognizes supported prefixes and strips them from search terms', () => {
    expect(parseSearchQuery('col:Some Collection')).toEqual(
      expect.objectContaining({
        scope: SEARCH_SCOPES.COLLECTION,
        matchedPrefix: 'col:',
        normalizedQuery: 'Some Collection',
        searchTerms: ['some', 'collection']
      })
    );
  });

  it('treats unknown prefixes as normal text', () => {
    expect(parseSearchQuery('foo:bar')).toEqual(
      expect.objectContaining({
        scope: SEARCH_SCOPES.ALL,
        hasRecognizedPrefix: false,
        normalizedQuery: 'foo:bar',
        searchTerms: ['foo:bar']
      })
    );
  });

  it('recognizes the spec prefix', () => {
    expect(parseSearchQuery('spec:petstore')).toEqual(
      expect.objectContaining({
        scope: SEARCH_SCOPES.API_SPEC,
        matchedPrefix: 'spec:',
        normalizedQuery: 'petstore',
        searchTerms: ['petstore']
      })
    );
  });
});

describe('global search collection environment results', () => {
  it('matches collection environments by environment name', () => {
    const results = searchCollectionEnvironments([
      {
        uid: 'col-1',
        name: 'Billing',
        environments: [{ uid: 'env-1', name: 'Staging', variables: [] }]
      }
    ], ['stag']);

    expect(results).toEqual([
      expect.objectContaining({
        type: SEARCH_TYPES.ENVIRONMENT,
        environmentUid: 'env-1',
        collectionUid: 'col-1',
        matchType: MATCH_TYPES.ENVIRONMENT
      })
    ]);
  });
});

describe('global search workspace scoping', () => {
  it('filters collections to the active workspace collections', () => {
    const results = filterCollectionsByWorkspace(
      [
        { uid: 'col-1', pathname: '/workspace-a/collections/billing' },
        { uid: 'col-2', pathname: '/workspace-b/collections/catalog' }
      ],
      {
        collections: [{ path: '/workspace-a/collections/billing' }]
      }
    );

    expect(results).toEqual([
      expect.objectContaining({ uid: 'col-1' })
    ]);
  });

  it('keeps the active workspace scratch collection in scope', () => {
    const results = filterCollectionsByWorkspace(
      [
        { uid: 'scratch-1' },
        { uid: 'col-1', pathname: '/workspace-a/collections/billing' }
      ],
      {
        scratchCollectionUid: 'scratch-1',
        collections: [{ path: '/workspace-a/collections/billing' }]
      }
    );

    expect(results).toEqual([
      expect.objectContaining({ uid: 'scratch-1' }),
      expect.objectContaining({ uid: 'col-1' })
    ]);
  });

  it('filters API specs to the active workspace specs', () => {
    const results = filterApiSpecsByWorkspace(
      [
        { uid: 'spec-1', pathname: '/workspace-a/specs/billing.yaml' },
        { uid: 'spec-2', pathname: '/workspace-b/specs/catalog.yaml' }
      ],
      {
        apiSpecs: [{ path: '/workspace-a/specs/billing.yaml' }]
      }
    );

    expect(results).toEqual([
      expect.objectContaining({ uid: 'spec-1' })
    ]);
  });
});

describe('global search environment results', () => {
  it('matches global environments by environment name', () => {
    const results = searchGlobalEnvironments([
      { uid: 'env-1', name: 'Production', variables: [] }
    ], ['prod']);

    expect(results).toEqual([
      expect.objectContaining({
        type: SEARCH_TYPES.GLOBAL_ENVIRONMENT,
        name: 'Production',
        environmentUid: 'env-1',
        matchType: MATCH_TYPES.GLOBAL_ENVIRONMENT
      })
    ]);
  });

  it('matches global environments by variable name', () => {
    const results = searchGlobalEnvironments([
      {
        uid: 'env-1',
        name: 'Production',
        variables: [{ name: 'apiHost', value: 'https://api.example.com', secret: false }]
      }
    ], ['apihost']);

    expect(results).toEqual([
      expect.objectContaining({
        type: SEARCH_TYPES.GLOBAL_ENVIRONMENT,
        environmentUid: 'env-1',
        matchType: MATCH_TYPES.VARIABLE,
        description: 'Variable: apiHost'
      })
    ]);
  });

  it('matches global environments by non-secret variable value but not by secret value', () => {
    const environments = [
      {
        uid: 'env-visible',
        name: 'Visible',
        variables: [{ name: 'host', value: 'https://visible.example.com', secret: false }]
      },
      {
        uid: 'env-secret',
        name: 'Secret',
        variables: [{ name: 'token', value: 'super-secret-token', secret: true }]
      }
    ];

    expect(searchGlobalEnvironments(environments, ['visible.example.com'])).toEqual([
      expect.objectContaining({
        environmentUid: 'env-visible'
      })
    ]);
    expect(searchGlobalEnvironments(environments, ['super-secret-token'])).toEqual([]);
  });
});

describe('global search result deduplication', () => {
  it('deduplicates collection results by collection identity', () => {
    const duplicatedResults = [
      {
        type: SEARCH_TYPES.COLLECTION,
        item: { uid: 'col-1', pathname: '/collections/account-service' },
        name: 'Billing',
        path: 'Billing',
        matchType: MATCH_TYPES.COLLECTION,
        collectionUid: 'col-1'
      },
      {
        type: SEARCH_TYPES.COLLECTION,
        item: { uid: 'col-1-copy', pathname: '/collections/account-service' },
        name: 'Billing',
        path: 'Billing',
        matchType: MATCH_TYPES.COLLECTION,
        collectionUid: 'col-1-copy'
      }
    ];

    expect(dedupeSearchResults(duplicatedResults)).toEqual([duplicatedResults[0]]);
  });

  it('keeps the highest-priority match for duplicate request results after sorting', () => {
    const duplicateRequestResults = [
      {
        type: SEARCH_TYPES.REQUEST,
        item: { uid: 'req-1' },
        name: 'Get invoices',
        path: 'Billing/Get invoices',
        matchType: MATCH_TYPES.PATH,
        collectionUid: 'col-1'
      },
      {
        type: SEARCH_TYPES.REQUEST,
        item: { uid: 'req-1' },
        name: 'Get invoices',
        path: 'Billing/Get invoices',
        matchType: MATCH_TYPES.REQUEST,
        collectionUid: 'col-1'
      }
    ];

    const dedupedResults = dedupeSearchResults(duplicateRequestResults.sort((a, b) => {
      const order = {
        [MATCH_TYPES.REQUEST]: 0,
        [MATCH_TYPES.PATH]: 1
      };

      return order[a.matchType] - order[b.matchType];
    }));

    expect(dedupedResults).toEqual([expect.objectContaining({ matchType: MATCH_TYPES.REQUEST })]);
  });

  it('deduplicates API spec results by pathname identity', () => {
    const duplicatedResults = [
      {
        type: SEARCH_TYPES.API_SPEC,
        item: { uid: 'spec-1', pathname: '/specs/petstore.yaml' },
        name: 'Petstore',
        path: '/specs/petstore.yaml',
        matchType: MATCH_TYPES.API_SPEC
      },
      {
        type: SEARCH_TYPES.API_SPEC,
        item: { uid: 'spec-2', pathname: '/specs/petstore.yaml' },
        name: 'Petstore copy',
        path: '/specs/petstore.yaml',
        matchType: MATCH_TYPES.PATH
      }
    ];

    expect(dedupeSearchResults(duplicatedResults)).toEqual([duplicatedResults[0]]);
  });
});
