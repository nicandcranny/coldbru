import { configureStore } from '@reduxjs/toolkit';
import collectionsReducer from 'providers/ReduxStore/slices/collections';
import requestTabViewMiddleware from './middleware';
import requestTabViewReducer from 'providers/ReduxStore/slices/requestTabView';
import tabsReducer, { addTab, focusTab } from 'providers/ReduxStore/slices/tabs';
import workspacesReducer from 'providers/ReduxStore/slices/workspaces';

const makeStore = (preloadedState) =>
  configureStore({
    reducer: {
      collections: collectionsReducer,
      requestTabView: requestTabViewReducer,
      tabs: tabsReducer,
      workspaces: workspacesReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(requestTabViewMiddleware.middleware),
    preloadedState
  });

describe('requestTabView middleware', () => {
  it('switches from home to all when opening a collection tab', () => {
    const store = makeStore({
      collections: {
        collections: [
          { uid: 'scratch-1', pathname: '/workspace/.scratch' },
          { uid: 'collection-1', pathname: '/workspace/collection-1' }
        ]
      },
      requestTabView: {
        mode: 'home',
        collectionUid: null
      },
      tabs: {
        activeTabUid: null,
        tabs: []
      },
      workspaces: {
        activeWorkspaceUid: 'workspace-1',
        workspaces: [
          {
            uid: 'workspace-1',
            scratchCollectionUid: 'scratch-1',
            collections: [{ path: '/workspace/collection-1' }]
          }
        ]
      }
    });

    store.dispatch(addTab({ uid: 'request-1', collectionUid: 'collection-1' }));

    expect(store.getState().requestTabView).toEqual({
      mode: 'all',
      collectionUid: null
    });
  });

  it('keeps home mode when opening a home tab', () => {
    const store = makeStore({
      collections: {
        collections: [
          { uid: 'scratch-1', pathname: '/workspace/.scratch' }
        ]
      },
      requestTabView: {
        mode: 'home',
        collectionUid: null
      },
      tabs: {
        activeTabUid: null,
        tabs: []
      },
      workspaces: {
        activeWorkspaceUid: 'workspace-1',
        workspaces: [
          {
            uid: 'workspace-1',
            scratchCollectionUid: 'scratch-1',
            collections: []
          }
        ]
      }
    });

    store.dispatch(addTab({ uid: 'scratch-1-overview', collectionUid: 'scratch-1', type: 'workspaceOverview' }));

    expect(store.getState().requestTabView).toEqual({
      mode: 'home',
      collectionUid: null
    });
  });

  it('switches collection mode to the opened collection tab', () => {
    const store = makeStore({
      collections: {
        collections: [
          { uid: 'scratch-1', pathname: '/workspace/.scratch' },
          { uid: 'collection-1', pathname: '/workspace/collection-1' },
          { uid: 'collection-2', pathname: '/workspace/collection-2' }
        ]
      },
      requestTabView: {
        mode: 'collection',
        collectionUid: 'collection-1'
      },
      tabs: {
        activeTabUid: null,
        tabs: []
      },
      workspaces: {
        activeWorkspaceUid: 'workspace-1',
        workspaces: [
          {
            uid: 'workspace-1',
            scratchCollectionUid: 'scratch-1',
            collections: [
              { path: '/workspace/collection-1' },
              { path: '/workspace/collection-2' }
            ]
          }
        ]
      }
    });

    store.dispatch(addTab({ uid: 'request-2', collectionUid: 'collection-2' }));

    expect(store.getState().requestTabView).toEqual({
      mode: 'collection',
      collectionUid: 'collection-2'
    });
  });

  it('switches collection mode when focusing a tab from another collection', () => {
    const store = makeStore({
      collections: {
        collections: [
          { uid: 'scratch-1', pathname: '/workspace/.scratch' },
          { uid: 'collection-1', pathname: '/workspace/collection-1' },
          { uid: 'collection-2', pathname: '/workspace/collection-2' }
        ]
      },
      requestTabView: {
        mode: 'collection',
        collectionUid: 'collection-1'
      },
      tabs: {
        activeTabUid: 'request-1',
        tabs: [
          { uid: 'request-1', collectionUid: 'collection-1' },
          { uid: 'request-2', collectionUid: 'collection-2' }
        ]
      },
      workspaces: {
        activeWorkspaceUid: 'workspace-1',
        workspaces: [
          {
            uid: 'workspace-1',
            scratchCollectionUid: 'scratch-1',
            collections: [
              { path: '/workspace/collection-1' },
              { path: '/workspace/collection-2' }
            ]
          }
        ]
      }
    });

    store.dispatch(focusTab({ uid: 'request-2' }));

    expect(store.getState().requestTabView).toEqual({
      mode: 'collection',
      collectionUid: 'collection-2'
    });
  });
});
