import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setRequestTabView } from 'providers/ReduxStore/slices/requestTabView';
import {
  addTab,
  focusTab,
  navigateBack,
  navigateForward
} from 'providers/ReduxStore/slices/tabs';
import {
  getWorkspaceCollectionUids,
  selectActiveWorkspace
} from '../../../../selectors/requestTabView';

const requestTabViewMiddleware = createListenerMiddleware();

const getWorkspaceTabForSwitch = (state, tabUid) => {
  if (!tabUid) {
    return null;
  }

  const workspace = selectActiveWorkspace(state);
  const scratchCollectionUid = workspace?.scratchCollectionUid;
  if (!workspace || !scratchCollectionUid) {
    return null;
  }

  const tab = state.tabs?.tabs?.find((item) => item.uid === tabUid);
  if (!tab?.collectionUid) {
    return null;
  }

  const workspaceCollectionUids = getWorkspaceCollectionUids(state, workspace);
  return workspaceCollectionUids.has(tab.collectionUid)
    ? { tab, scratchCollectionUid }
    : null;
};

const maybeSyncRequestTabViewWithActiveTab = (listenerApi, tabUid) => {
  const state = listenerApi.getState();
  const tabState = getWorkspaceTabForSwitch(state, tabUid);
  if (!tabState) {
    return;
  }

  const requestTabView = state.requestTabView || {
    mode: 'home',
    collectionUid: null
  };

  if (tabState.tab.collectionUid === tabState.scratchCollectionUid) {
    const mode = ['workspaceOverview', 'global-environment-settings'].includes(
      tabState.tab.type
    )
      ? 'home'
      : 'all';
    if (requestTabView.mode !== mode) {
      listenerApi.dispatch(setRequestTabView({ mode, collectionUid: null }));
    }
    return;
  }

  if (requestTabView.mode === 'home') {
    listenerApi.dispatch(
      setRequestTabView({ mode: 'all', collectionUid: null })
    );
    return;
  }

  if (
    requestTabView.mode === 'collection'
    && requestTabView.collectionUid !== tabState.tab.collectionUid
  ) {
    listenerApi.dispatch(
      setRequestTabView({
        mode: 'collection',
        collectionUid: tabState.tab.collectionUid
      })
    );
  }
};

requestTabViewMiddleware.startListening({
  actionCreator: addTab,
  effect: (action, listenerApi) => {
    maybeSyncRequestTabViewWithActiveTab(listenerApi, action.payload?.uid);
  }
});

requestTabViewMiddleware.startListening({
  actionCreator: focusTab,
  effect: (action, listenerApi) => {
    maybeSyncRequestTabViewWithActiveTab(listenerApi, action.payload?.uid);
  }
});

requestTabViewMiddleware.startListening({
  actionCreator: navigateBack,
  effect: (_, listenerApi) => {
    maybeSyncRequestTabViewWithActiveTab(
      listenerApi,
      listenerApi.getState().tabs.activeTabUid
    );
  }
});

requestTabViewMiddleware.startListening({
  actionCreator: navigateForward,
  effect: (_, listenerApi) => {
    maybeSyncRequestTabViewWithActiveTab(
      listenerApi,
      listenerApi.getState().tabs.activeTabUid
    );
  }
});

export default requestTabViewMiddleware;
