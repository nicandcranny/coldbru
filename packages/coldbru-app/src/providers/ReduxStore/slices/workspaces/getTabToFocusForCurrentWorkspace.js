import filter from 'lodash/filter';
import find from 'lodash/find';
import last from 'lodash/last';
import { getOverviewTabResult, getWorkspaceCollectionUids } from '../../../../selectors/requestTabView';

/**
 * Returns the tab to focus so the active tab is in the current workspace, or null if no change needed.
 * Returns { uid } or { uid, addOverviewFirst: true, scratchCollectionUid }.
 */
export function getTabToFocusForCurrentWorkspace(state) {
  const activeTabUid = state.tabs?.activeTabUid;
  if (!activeTabUid || !state.tabs?.tabs?.length) {
    return null;
  }
  const activeTab = find(state.tabs.tabs, (t) => t.uid === activeTabUid);
  if (!activeTab) {
    return null;
  }
  const activeWorkspace = state.workspaces?.workspaces?.find(
    (w) => w.uid === state.workspaces?.activeWorkspaceUid
  );
  if (!activeWorkspace) {
    return null;
  }
  const workspaceCollectionUids = getWorkspaceCollectionUids(state, activeWorkspace);
  const requestTabView = state.requestTabView || { mode: 'home', collectionUid: null };
  const scratchCollectionUid = activeWorkspace.scratchCollectionUid;

  if (requestTabView.mode === 'home') {
    if (scratchCollectionUid && activeTab.collectionUid === scratchCollectionUid) {
      return null;
    }

    const homeTabs = scratchCollectionUid
      ? filter(state.tabs.tabs, (tab) => tab.collectionUid === scratchCollectionUid)
      : [];

    if (homeTabs.length > 0) {
      return { uid: last(homeTabs).uid };
    }

    return getOverviewTabResult(scratchCollectionUid);
  }

  if (requestTabView.mode === 'all' && workspaceCollectionUids.has(activeTab.collectionUid)) {
    return null;
  }

  if (requestTabView.mode === 'collection') {
    const selectedCollectionUid = requestTabView.collectionUid;
    if (selectedCollectionUid && activeTab.collectionUid === selectedCollectionUid) {
      return null;
    }

    const selectedCollectionTabs = selectedCollectionUid
      ? filter(state.tabs.tabs, (tab) => tab.collectionUid === selectedCollectionUid)
      : [];

    if (selectedCollectionTabs.length > 0) {
      return { uid: last(selectedCollectionTabs).uid };
    }

    if (workspaceCollectionUids.has(activeTab.collectionUid)) {
      return null;
    }
  }

  const inWorkspaceTabs = filter(state.tabs.tabs, (t) => workspaceCollectionUids.has(t.collectionUid));
  if (inWorkspaceTabs.length > 0) {
    return { uid: last(inWorkspaceTabs).uid };
  }

  const overviewResult = getOverviewTabResult(scratchCollectionUid);
  if (!overviewResult) {
    return null;
  }

  const overviewTabExists = state.tabs.tabs.some((tab) => tab.uid === overviewResult.uid);
  if (overviewTabExists) {
    return { uid: overviewResult.uid };
  }

  return overviewResult;
}
