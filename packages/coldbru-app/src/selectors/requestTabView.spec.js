import { selectResolvedRequestTabView } from './requestTabView';

function buildState(overrides = {}) {
  const wsA = {
    uid: 'workspace-a',
    scratchCollectionUid: 'scratch-a',
    collections: [{ path: '/path/col-a' }, { path: '/path/col-a-2' }]
  };
  const wsB = {
    uid: 'workspace-b',
    scratchCollectionUid: 'scratch-b',
    collections: [{ path: '/path/col-b' }]
  };
  const colA = { uid: 'col-a', pathname: '/path/col-a', name: 'Collection A' };
  const colA2 = { uid: 'col-a-2', pathname: '/path/col-a-2', name: 'Collection A2' };
  const colB = { uid: 'col-b', pathname: '/path/col-b', name: 'Collection B' };

  return {
    tabs: {
      activeTabUid: 'tab-a-1',
      tabs: [
        { uid: 'scratch-a-overview', collectionUid: 'scratch-a', type: 'workspaceOverview' },
        { uid: 'tab-a-1', collectionUid: 'col-a', type: 'request' },
        { uid: 'tab-a-2', collectionUid: 'col-a-2', type: 'collection-settings' },
        { uid: 'tab-b-1', collectionUid: 'col-b', type: 'request' }
      ]
    },
    workspaces: {
      activeWorkspaceUid: 'workspace-a',
      workspaces: [wsA, wsB]
    },
    collections: {
      collections: [colA, colA2, colB]
    },
    requestTabView: {
      mode: 'home',
      collectionUid: null
    },
    ...overrides
  };
}

describe('selectResolvedRequestTabView', () => {
  it('returns only scratch tabs for home mode', () => {
    const result = selectResolvedRequestTabView(buildState());

    expect(result.mode).toBe('home');
    expect(result.visibleTabs.map((tab) => tab.uid)).toEqual(['scratch-a-overview']);
  });

  it('returns all workspace tabs for all mode', () => {
    const result = selectResolvedRequestTabView(buildState({
      requestTabView: {
        mode: 'all',
        collectionUid: null
      }
    }));

    expect(result.mode).toBe('all');
    expect(result.visibleTabs.map((tab) => tab.uid)).toEqual([
      'tab-a-1',
      'tab-a-2'
    ]);
  });

  it('returns only the selected collection tabs for collection mode', () => {
    const result = selectResolvedRequestTabView(buildState({
      requestTabView: {
        mode: 'collection',
        collectionUid: 'col-a-2'
      }
    }));

    expect(result.mode).toBe('collection');
    expect(result.collectionUid).toBe('col-a-2');
    expect(result.visibleTabs.map((tab) => tab.uid)).toEqual(['tab-a-2']);
  });

  it('falls back to the active workspace collection when selected collection is stale', () => {
    const result = selectResolvedRequestTabView(buildState({
      requestTabView: {
        mode: 'collection',
        collectionUid: 'col-b'
      }
    }));

    expect(result.mode).toBe('collection');
    expect(result.collectionUid).toBe('col-a');
    expect(result.visibleTabs.map((tab) => tab.uid)).toEqual(['tab-a-1']);
  });

  it('excludes tabs from other workspaces in all mode', () => {
    const result = selectResolvedRequestTabView(buildState({
      requestTabView: {
        mode: 'all',
        collectionUid: null
      }
    }));

    expect(result.visibleTabs.some((tab) => tab.uid === 'tab-b-1')).toBe(false);
  });
});
