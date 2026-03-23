const { describe, it, expect } = require('@jest/globals');

const collectionsModule = require('./index');

const reducer = collectionsModule.default;
const { createCollection } = collectionsModule;

describe('collections reducer', () => {
  it('does not add the same collection twice when the pathname matches but the uid differs', () => {
    const initialState = {
      collections: [],
      collectionSortOrder: 'default',
      activeConnections: [],
      tempDirectories: {},
      saveTransientRequestModals: []
    };

    const firstState = reducer(initialState, createCollection({
      uid: 'collection-1',
      name: 'Account Service',
      pathname: '/tmp/account-service',
      items: [],
      environments: [],
      runtimeVariables: {},
      brunoConfig: {
        name: 'Account Service',
        type: 'collection',
        version: '1'
      }
    }));

    const secondState = reducer(firstState, createCollection({
      uid: 'collection-2',
      name: 'Account Service',
      pathname: '/tmp/account-service/',
      items: [],
      environments: [],
      runtimeVariables: {},
      brunoConfig: {
        name: 'Account Service',
        type: 'collection',
        version: '1'
      }
    }));

    expect(secondState.collections).toHaveLength(1);
    expect(secondState.collections[0]).toEqual(expect.objectContaining({
      uid: 'collection-1',
      pathname: '/tmp/account-service'
    }));
  });
});
