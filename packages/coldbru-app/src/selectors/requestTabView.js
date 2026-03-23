import { createSelector } from '@reduxjs/toolkit';
import last from 'lodash/last';
import { normalizePath } from 'utils/common/path';

export const selectActiveWorkspace = (state) => {
  const activeWorkspaceUid = state.workspaces?.activeWorkspaceUid;
  return state.workspaces?.workspaces?.find((workspace) => workspace.uid === activeWorkspaceUid) || null;
};

export const getWorkspaceCollectionUids = (state, workspace) => {
  if (!workspace) {
    return new Set();
  }

  const uids = new Set();
  if (workspace.scratchCollectionUid) {
    uids.add(workspace.scratchCollectionUid);
  }

  const workspacePaths = new Set(
    (workspace.collections || [])
      .filter((collection) => collection.path)
      .map((collection) => normalizePath(collection.path))
  );

  state.collections?.collections?.forEach((collection) => {
    if (!collection.pathname) {
      return;
    }

    if (workspacePaths.has(normalizePath(collection.pathname))) {
      uids.add(collection.uid);
    }
  });

  return uids;
};

export const selectResolvedRequestTabView = createSelector(
  [
    (state) => state.tabs?.tabs || [],
    (state) => state.tabs?.activeTabUid,
    (state) => state.collections?.collections || [],
    selectActiveWorkspace,
    (state) => state.requestTabView || { mode: 'home', collectionUid: null }
  ],
  (tabs, activeTabUid, collections, workspace, requestTabView) => {
    const activeTab = tabs.find((tab) => tab.uid === activeTabUid) || null;
    const workspaceCollectionUids = getWorkspaceCollectionUids(
      { collections: { collections } },
      workspace
    );
    const scratchCollectionUid = workspace?.scratchCollectionUid || null;

    let mode = requestTabView.mode || 'home';
    let collectionUid = requestTabView.collectionUid || null;

    if (mode === 'collection') {
      const selectedCollectionInWorkspace = collectionUid
        && collectionUid !== scratchCollectionUid
        && workspaceCollectionUids.has(collectionUid);
      const activeCollectionInWorkspace = activeTab?.collectionUid
        && activeTab.collectionUid !== scratchCollectionUid
        && workspaceCollectionUids.has(activeTab.collectionUid);

      if (!selectedCollectionInWorkspace) {
        if (activeCollectionInWorkspace) {
          collectionUid = activeTab.collectionUid;
        } else {
          mode = 'home';
          collectionUid = null;
        }
      }
    }

    let visibleTabs = [];
    if (mode === 'home') {
      visibleTabs = scratchCollectionUid
        ? tabs.filter((tab) => tab.collectionUid === scratchCollectionUid)
        : [];
    } else if (mode === 'all') {
      visibleTabs = tabs.filter((tab) => {
        if (!workspaceCollectionUids.has(tab.collectionUid)) {
          return false;
        }

        return tab.type !== 'workspaceOverview';
      });
    } else {
      visibleTabs = collectionUid
        ? tabs.filter((tab) => tab.collectionUid === collectionUid)
        : [];
    }

    const selectedCollection = collectionUid
      ? collections.find((collection) => collection.uid === collectionUid) || null
      : null;

    return {
      mode,
      collectionUid,
      selectedCollection,
      visibleTabs,
      visibleTabUids: new Set(visibleTabs.map((tab) => tab.uid)),
      scratchCollectionUid,
      workspace,
      workspaceCollectionUids,
      activeTab,
      activeTabInWorkspace: !!(activeTab && workspaceCollectionUids.has(activeTab.collectionUid)),
      lastVisibleTabUid: last(visibleTabs)?.uid || null
    };
  }
);

export const getOverviewTabResult = (scratchCollectionUid) => {
  if (!scratchCollectionUid) {
    return null;
  }

  return {
    uid: `${scratchCollectionUid}-overview`,
    addOverviewFirst: true,
    scratchCollectionUid
  };
};
