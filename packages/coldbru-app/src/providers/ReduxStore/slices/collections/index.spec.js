const { describe, it, expect } = require('@jest/globals');

const collectionsModule = require('./index');

const reducer = collectionsModule.default;
const { createCollection, runFolderEvent, updateRunnerConfiguration } = collectionsModule;

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

  it('tracks repeated runner executions by runnerItemUid', () => {
    const initialState = {
      collections: [{
        uid: 'collection-1',
        pathname: '/tmp/account-service',
        items: [{
          uid: 'request-1',
          type: 'http-request',
          name: 'Get users',
          pathname: '/tmp/account-service/get-users.bru'
        }]
      }],
      collectionSortOrder: 'default',
      activeConnections: [],
      tempDirectories: {},
      saveTransientRequestModals: []
    };

    const queuedFirst = reducer(initialState, runFolderEvent({
      type: 'request-queued',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-1',
      iterationIndex: 0,
      iterationCount: 2
    }));

    const queuedSecond = reducer(queuedFirst, runFolderEvent({
      type: 'request-queued',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-2',
      iterationIndex: 1,
      iterationCount: 2
    }));

    const firstRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?page=1'
    };

    const secondRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?page=2'
    };

    const firstSent = reducer(queuedSecond, runFolderEvent({
      type: 'request-sent',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-1',
      request: firstRequest,
      requestSent: { method: 'GET', url: 'https://api.example.com/users?page=1', timestamp: 1000 }
    }));

    const secondSent = reducer(firstSent, runFolderEvent({
      type: 'request-sent',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-2',
      request: secondRequest,
      requestSent: { method: 'GET', url: 'https://api.example.com/users?page=2', timestamp: 2000 }
    }));

    const completed = reducer(secondSent, runFolderEvent({
      type: 'response-received',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-2',
      request: secondRequest,
      responseReceived: { status: 200, statusText: 'OK' }
    }));

    expect(completed.collections[0].runnerResult.items).toEqual([
      expect.objectContaining({
        uid: 'request-1',
        runnerItemUid: 'run-1',
        status: 'running',
        request: firstRequest,
        requestSent: { method: 'GET', url: 'https://api.example.com/users?page=1', timestamp: 1000 }
      }),
      expect.objectContaining({
        uid: 'request-1',
        runnerItemUid: 'run-2',
        status: 'completed',
        request: secondRequest,
        requestSent: { method: 'GET', url: 'https://api.example.com/users?page=2', timestamp: 2000 },
        responseReceived: { status: 200, statusText: 'OK' }
      })
    ]);
  });

  it('stores runner request snapshots for skipped requests when provided', () => {
    const initialState = {
      collections: [{
        uid: 'collection-1',
        pathname: '/tmp/account-service',
        items: [{
          uid: 'request-1',
          type: 'http-request',
          name: 'Get users',
          pathname: '/tmp/account-service/get-users.bru'
        }]
      }],
      collectionSortOrder: 'default',
      activeConnections: [],
      tempDirectories: {},
      saveTransientRequestModals: []
    };

    const queued = reducer(initialState, runFolderEvent({
      type: 'request-queued',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-1'
    }));

    const runnerRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?prompt={{token}}'
    };

    const skipped = reducer(queued, runFolderEvent({
      type: 'runner-request-skipped',
      collectionUid: 'collection-1',
      itemUid: 'request-1',
      runnerItemUid: 'run-1',
      request: runnerRequest,
      responseReceived: {
        status: 'skipped',
        statusText: 'Prompt variables detected'
      }
    }));

    expect(skipped.collections[0].runnerResult.items).toEqual([
      expect.objectContaining({
        uid: 'request-1',
        runnerItemUid: 'run-1',
        status: 'skipped',
        request: runnerRequest,
        responseReceived: {
          status: 'skipped',
          statusText: 'Prompt variables detected'
        }
      })
    ]);
  });

  it('preserves runner CSV data when request ordering changes', () => {
    const initialState = {
      collections: [{
        uid: 'collection-1',
        runnerConfiguration: {
          runnerData: {
            fileName: 'users.csv',
            rows: [{ iterationIndex: 0, variables: { email: 'ada@example.com' } }]
          }
        }
      }],
      collectionSortOrder: 'default',
      activeConnections: [],
      tempDirectories: {},
      saveTransientRequestModals: []
    };

    const state = reducer(initialState, updateRunnerConfiguration({
      collectionUid: 'collection-1',
      selectedRequestItems: ['request-1'],
      requestItemsOrder: ['request-1']
    }));

    expect(state.collections[0].runnerConfiguration).toEqual(expect.objectContaining({
      selectedRequestItems: ['request-1'],
      requestItemsOrder: ['request-1'],
      runnerData: initialState.collections[0].runnerConfiguration.runnerData
    }));
  });
});
