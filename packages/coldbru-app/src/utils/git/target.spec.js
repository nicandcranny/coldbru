import { getGitTarget } from './target';

const createState = ({
  activeWorkspaceUid = 'workspace-1',
  activeTabUid = 'tab-1',
  workspaces = [],
  tabs = [],
  collections = []
} = {}) => ({
  workspaces: {
    activeWorkspaceUid,
    workspaces
  },
  tabs: {
    activeTabUid,
    tabs
  },
  collections: {
    collections
  }
});

describe('getGitTarget', () => {
  test('returns workspace scope for scratch collection tabs', () => {
    const state = createState({
      workspaces: [{
        uid: 'workspace-1',
        name: 'Workspace One',
        pathname: '/workspace-one',
        scratchCollectionUid: 'scratch-1',
        collections: []
      }],
      tabs: [{ uid: 'tab-1', collectionUid: 'scratch-1' }]
    });

    expect(getGitTarget(state)).toEqual({
      scopeId: 'workspace:workspace-1',
      path: '/workspace-one',
      kind: 'workspace',
      name: 'Workspace One',
      collectionUid: 'scratch-1',
      workspaceUid: 'workspace-1'
    });
  });

  test('returns workspace scope for collections inside the active workspace', () => {
    const state = createState({
      workspaces: [{
        uid: 'workspace-1',
        name: 'Workspace One',
        pathname: '/workspace-one',
        scratchCollectionUid: 'scratch-1',
        collections: [{ path: '/workspace-one/collections/api' }]
      }],
      tabs: [{ uid: 'tab-1', collectionUid: 'collection-1' }],
      collections: [{
        uid: 'collection-1',
        name: 'API',
        pathname: '/workspace-one/collections/api'
      }]
    });

    expect(getGitTarget(state)).toEqual({
      scopeId: 'workspace:workspace-1',
      path: '/workspace-one',
      kind: 'workspace',
      name: 'Workspace One',
      collectionUid: 'collection-1',
      workspaceUid: 'workspace-1'
    });
  });

  test('falls back to collection scope when the collection is outside the active workspace', () => {
    const state = createState({
      workspaces: [{
        uid: 'workspace-1',
        name: 'Workspace One',
        pathname: '/workspace-one',
        scratchCollectionUid: 'scratch-1',
        collections: [{ path: '/workspace-one/collections/api' }]
      }],
      tabs: [{ uid: 'tab-1', collectionUid: 'collection-2' }],
      collections: [{
        uid: 'collection-2',
        name: 'External API',
        pathname: '/external/api'
      }]
    });

    expect(getGitTarget(state)).toEqual({
      scopeId: 'collection:collection-2',
      path: '/external/api',
      kind: 'collection',
      name: 'External API',
      collectionUid: 'collection-2',
      workspaceUid: 'workspace-1'
    });
  });
});
