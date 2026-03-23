const { describe, it, expect } = require('@jest/globals');

import {
  doesCollectionHaveItemsMatchingSearchText,
  doesCollectionMatchSearchText,
  doesFolderMatchSearchText,
  doesRequestMatchSearchText,
  getCollectionSearchState,
  getFolderSearchState
} from './search';

describe('collection search', () => {
  it('matches request names', () => {
    expect(doesRequestMatchSearchText({ name: 'Get Users' }, 'users')).toBe(true);
  });

  it('matches collection names directly', () => {
    expect(doesCollectionMatchSearchText({ name: 'Billing APIs' }, 'billing')).toBe(true);
  });

  it('matches folder names directly', () => {
    expect(doesFolderMatchSearchText({ type: 'folder', name: 'Billing' }, 'billing')).toBe(true);
  });

  it('keeps a collection visible when the collection name matches and requests do not', () => {
    const collection = {
      name: 'Billing APIs',
      items: [
        {
          type: 'http-request',
          name: 'Get invoices',
          request: {}
        }
      ]
    };

    expect(doesCollectionHaveItemsMatchingSearchText(collection, 'billing')).toBe(true);
  });

  it('still matches a collection by descendant request names', () => {
    const collection = {
      name: 'Payments',
      items: [
        {
          type: 'folder',
          name: 'Invoices',
          items: [
            {
              type: 'http-request',
              name: 'Create Billing Cycle',
              request: {}
            }
          ]
        }
      ]
    };

    expect(doesCollectionHaveItemsMatchingSearchText(collection, 'billing')).toBeTruthy();
  });

  it('collapses a matching collection in search when only the collection name matches', () => {
    const collection = {
      name: 'Billing APIs',
      items: [
        {
          type: 'http-request',
          name: 'Get invoices',
          request: {}
        }
      ]
    };

    expect(getCollectionSearchState(collection, 'billing')).toEqual({
      hasMatchingRequestInSubtree: false,
      isCollapsedInSearch: true,
      isDirectMatch: true,
      shouldShow: true,
      showAllChildrenOnExpand: true
    });
  });

  it('keeps matching request branches expanded during search even when the folder also matches', () => {
    const folder = {
      type: 'folder',
      name: 'Billing',
      items: [
        {
          type: 'http-request',
          name: 'Create Billing Cycle',
          request: {}
        },
        {
          type: 'http-request',
          name: 'Get invoices',
          request: {}
        }
      ]
    };

    expect(getFolderSearchState(folder, 'billing')).toEqual({
      hasMatchingRequestInSubtree: true,
      isCollapsedInSearch: false,
      isDirectMatch: true,
      shouldShow: true,
      showAllChildrenOnExpand: false
    });
  });
});
