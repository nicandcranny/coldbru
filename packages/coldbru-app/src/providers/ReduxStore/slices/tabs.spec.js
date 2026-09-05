import tabsReducer, {
  addTab,
  closeTabs,
  focusTab,
  navigateBack,
  navigateForward
} from './tabs';

const addRequestTab = (state, uid) =>
  tabsReducer(
    state,
    addTab({
      uid,
      collectionUid: 'collection-1',
      preview: false
    })
  );

describe('tabs navigation history', () => {
  it('navigates backward and forward through focused tabs', () => {
    let state = addRequestTab(undefined, 'tab-1');
    state = addRequestTab(state, 'tab-2');
    state = addRequestTab(state, 'tab-3');

    state = tabsReducer(state, navigateBack());
    expect(state.activeTabUid).toBe('tab-2');
    expect(state.tabHistory).toEqual({ back: ['tab-1'], forward: ['tab-3'] });

    state = tabsReducer(state, navigateBack());
    expect(state.activeTabUid).toBe('tab-1');

    state = tabsReducer(state, navigateForward());
    expect(state.activeTabUid).toBe('tab-2');
    expect(state.tabHistory).toEqual({ back: ['tab-1'], forward: ['tab-3'] });
  });

  it('clears forward history when a tab is focused directly', () => {
    let state = addRequestTab(undefined, 'tab-1');
    state = addRequestTab(state, 'tab-2');
    state = addRequestTab(state, 'tab-3');
    state = tabsReducer(state, navigateBack());

    state = tabsReducer(state, focusTab({ uid: 'tab-1' }));

    expect(state.activeTabUid).toBe('tab-1');
    expect(state.tabHistory.forward).toEqual([]);
  });

  it('restores replaced preview tabs through back and forward navigation', () => {
    let state = tabsReducer(
      undefined,
      addTab({ uid: 'tab-1', collectionUid: 'collection-1' })
    );
    state = tabsReducer(
      state,
      addTab({ uid: 'tab-2', collectionUid: 'collection-1' })
    );

    expect(state.tabs.map((tab) => tab.uid)).toEqual(['tab-2']);

    state = tabsReducer(state, navigateBack());
    expect(state.activeTabUid).toBe('tab-1');
    expect(state.tabs.map((tab) => tab.uid)).toEqual(['tab-1']);

    state = tabsReducer(state, navigateForward());
    expect(state.activeTabUid).toBe('tab-2');
    expect(state.tabs.map((tab) => tab.uid)).toEqual(['tab-2']);
  });

  it('removes closed tabs from history', () => {
    let state = addRequestTab(undefined, 'tab-1');
    state = addRequestTab(state, 'tab-2');
    state = addRequestTab(state, 'tab-3');
    state = tabsReducer(state, navigateBack());

    state = tabsReducer(state, closeTabs({ tabUids: ['tab-2'] }));

    expect(state.activeTabUid).toBe('tab-3');
    expect(state.tabHistory).toEqual({ back: ['tab-1'], forward: [] });

    state = tabsReducer(state, navigateBack());
    expect(state.activeTabUid).toBe('tab-1');
  });
});
