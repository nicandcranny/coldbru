import { createSlice } from '@reduxjs/toolkit';
import filter from 'lodash/filter';
import find from 'lodash/find';
import last from 'lodash/last';

// todo: errors should be tracked in each slice and displayed as toasts

const initialState = {
  tabs: [],
  activeTabUid: null,
  tabHistory: {
    back: [],
    forward: []
  }
};

const tabTypeAlreadyExists = (tabs, collectionUid, type) => {
  return find(
    tabs,
    (tab) => tab.collectionUid === collectionUid && tab.type === type
  );
};

const getTabHistory = (state) => {
  if (!state.tabHistory) {
    state.tabHistory = { back: [], forward: [] };
  }

  return state.tabHistory;
};

const cleanTabHistory = (state) => {
  const history = getTabHistory(state);
  const openTabUids = new Set(state.tabs.map((tab) => tab.uid));

  history.back = history.back.filter((uid) => openTabUids.has(uid));
  history.forward = history.forward.filter((uid) => openTabUids.has(uid));

  while (history.back.at(-1) === state.activeTabUid) history.back.pop();
  while (history.forward.at(-1) === state.activeTabUid) history.forward.pop();
};

const activateTab = (state, uid) => {
  if (!uid || uid === state.activeTabUid) return;

  const history = getTabHistory(state);
  if (state.activeTabUid) history.back.push(state.activeTabUid);
  history.forward = [];
  state.activeTabUid = uid;
  cleanTabHistory(state);
};

const navigateTabHistory = (state, direction) => {
  const history = getTabHistory(state);
  const source = history[direction];
  const destination = direction === 'back' ? history.forward : history.back;

  while (source.length) {
    const uid = source.pop();
    if (
      uid !== state.activeTabUid
      && state.tabs.some((tab) => tab.uid === uid)
    ) {
      if (state.activeTabUid) destination.push(state.activeTabUid);
      state.activeTabUid = uid;
      return;
    }
  }
};

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    addTab: (state, action) => {
      const {
        uid,
        collectionUid,
        type,
        requestPaneTab,
        preview,
        exampleUid,
        itemUid,
        environmentUid,
        tabName,
        filePath,
        changeType,
        from,
        to,
        gitScopePath,
        apiSpecUid
      } = action.payload;

      const nonReplaceableTabTypes = [
        'variables',
        'collection-runner',
        'environment-settings',
        'global-environment-settings',
        'preferences',
        'workspaceOverview',
        'workspaceEnvironments',
        'openapi-sync',
        'openapi-spec'
      ];

      const existingTab = find(state.tabs, (tab) => tab.uid === uid);
      if (existingTab) {
        activateTab(state, existingTab.uid);
        return;
      }

      if (nonReplaceableTabTypes.includes(type)) {
        const existingTab = tabTypeAlreadyExists(
          state.tabs,
          collectionUid,
          type
        );
        if (existingTab) {
          activateTab(state, existingTab.uid);
          return;
        }
      }

      // Determine the default requestPaneTab based on request type
      let defaultRequestPaneTab = 'params';
      if (type === 'grpc-request' || type === 'ws-request') {
        defaultRequestPaneTab = 'body';
      } else if (type === 'graphql-request') {
        defaultRequestPaneTab = 'query';
      }

      const lastTab = state.tabs[state.tabs.length - 1];
      if (state.tabs.length > 0 && lastTab.preview) {
        state.tabs[state.tabs.length - 1] = {
          uid,
          collectionUid,
          requestPaneWidth: null,
          requestPaneTab: requestPaneTab || defaultRequestPaneTab,
          responsePaneTab: 'response',
          responseFormat: null,
          responseViewTab: null,
          scriptPaneTab: null,
          type: type || 'request',
          preview:
            preview === undefined
              ? !nonReplaceableTabTypes.includes(type)
              : preview,
          ...(environmentUid ? { environmentUid } : {}),
          ...(tabName ? { tabName } : {}),
          ...(filePath ? { filePath } : {}),
          ...(changeType ? { changeType } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(gitScopePath ? { gitScopePath } : {}),
          ...(apiSpecUid ? { apiSpecUid } : {}),
          ...(uid ? { folderUid: uid } : {}),
          ...(exampleUid ? { exampleUid } : {}),
          ...(itemUid ? { itemUid } : {})
        };

        activateTab(state, uid);
        return;
      }

      state.tabs.push({
        uid,
        collectionUid,
        requestPaneWidth: null,
        requestPaneTab: requestPaneTab || defaultRequestPaneTab,
        responsePaneTab: 'response',
        responsePaneScrollPosition: null,
        responseFormat: null,
        responseViewTab: null,
        scriptPaneTab: null,
        type: type || 'request',
        ...(uid ? { folderUid: uid } : {}),
        preview:
          preview === undefined
            ? !nonReplaceableTabTypes.includes(type)
            : preview,
        ...(environmentUid ? { environmentUid } : {}),
        ...(tabName ? { tabName } : {}),
        ...(filePath ? { filePath } : {}),
        ...(changeType ? { changeType } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(gitScopePath ? { gitScopePath } : {}),
        ...(apiSpecUid ? { apiSpecUid } : {}),
        ...(exampleUid ? { exampleUid } : {}),
        ...(itemUid ? { itemUid } : {})
      });
      activateTab(state, uid);
    },
    updateTab: (state, action) => {
      const { uid, ...updates } = action.payload;
      const tab = find(state.tabs, (t) => t.uid === uid);
      if (tab) {
        Object.assign(tab, updates);
      }
    },
    focusTab: (state, action) => {
      const { uid } = action.payload;
      const tabExists = state.tabs.some((t) => t.uid === uid);
      if (tabExists) {
        activateTab(state, uid);
      }
    },
    navigateBack: (state) => {
      navigateTabHistory(state, 'back');
    },
    navigateForward: (state) => {
      navigateTabHistory(state, 'forward');
    },
    switchTab: (state, action) => {
      if (!state.tabs || !state.tabs.length) {
        state.activeTabUid = null;
        return;
      }

      const direction = action.payload.direction;

      const activeTabIndex = state.tabs.findIndex(
        (t) => t.uid === state.activeTabUid
      );

      let toBeActivatedTabIndex = 0;

      if (direction == 'pageup') {
        toBeActivatedTabIndex
          = (activeTabIndex - 1 + state.tabs.length) % state.tabs.length;
      } else if (direction == 'pagedown') {
        toBeActivatedTabIndex = (activeTabIndex + 1) % state.tabs.length;
      }

      activateTab(state, state.tabs[toBeActivatedTabIndex].uid);
    },
    updateRequestPaneTabWidth: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.requestPaneWidth = action.payload.requestPaneWidth;
      }
    },
    updateRequestPaneTabHeight: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.requestPaneHeight = action.payload.requestPaneHeight;
      }
    },
    updateRequestPaneTab: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.requestPaneTab = action.payload.requestPaneTab;
      }
    },
    updateResponsePaneTab: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.responsePaneTab = action.payload.responsePaneTab;
      }
    },
    updateResponsePaneScrollPosition: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.responsePaneScrollPosition = action.payload.scrollY;
      }
    },
    updateRequestBodyScrollPosition: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.requestBodyScrollPosition = action.payload.scrollY;
      }
    },
    updateResponseFormat: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.responseFormat = action.payload.responseFormat;
      }
    },
    updateResponseViewTab: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.responseViewTab = action.payload.responseViewTab;
      }
    },
    updateScriptPaneTab: (state, action) => {
      const tab = find(state.tabs, (t) => t.uid === action.payload.uid);

      if (tab) {
        tab.scriptPaneTab = action.payload.scriptPaneTab;
      }
    },
    closeTabs: (state, action) => {
      const activeTab = find(state.tabs, (t) => t.uid === state.activeTabUid);
      const tabUids = action.payload.tabUids || [];

      const nonClosableTypes = ['workspaceOverview', 'workspaceEnvironments'];
      state.tabs = filter(
        state.tabs,
        (t) => !tabUids.includes(t.uid) || nonClosableTypes.includes(t.type)
      );

      if (activeTab && state.tabs.length) {
        const { collectionUid } = activeTab;
        const activeTabStillExists = find(
          state.tabs,
          (t) => t.uid === state.activeTabUid
        );

        // if the active tab no longer exists, set the active tab to the last tab in the list
        // this implies that the active tab was closed
        if (!activeTabStillExists) {
          // load sibling tabs of the current collection
          const siblingTabs = filter(
            state.tabs,
            (t) => t.collectionUid === collectionUid
          );

          // if there are sibling tabs, set the active tab to the last sibling tab
          // otherwise, set the active tab to the last tab in the list
          if (siblingTabs && siblingTabs.length) {
            state.activeTabUid = last(siblingTabs).uid;
          } else {
            state.activeTabUid = last(state.tabs).uid;
          }
        }
      }

      if (!state.tabs || !state.tabs.length) {
        state.activeTabUid = null;
      }

      cleanTabHistory(state);
    },
    closeAllCollectionTabs: (state, action) => {
      const { collectionUid } = action.payload;
      const prevActiveTabUid = state.activeTabUid;
      state.tabs = filter(state.tabs, (t) => t.collectionUid !== collectionUid);

      const activeTabStillExists = state.tabs.some(
        (t) => t.uid === prevActiveTabUid
      );
      if (!activeTabStillExists) {
        state.activeTabUid
          = state.tabs.length > 0 ? last(state.tabs).uid : null;
      }

      cleanTabHistory(state);
    },
    makeTabPermanent: (state, action) => {
      const { uid } = action.payload;
      const tab = find(state.tabs, (t) => t.uid === uid);
      if (tab) {
        tab.preview = false;
      } else {
        console.error('Tab not found!');
      }
    },
    reorderTabs: (state, action) => {
      const { direction, sourceUid, targetUid } = action.payload;
      const tabs = state.tabs;

      let sourceIdx, targetIdx;
      if (direction) {
        sourceIdx = tabs.findIndex((t) => t.uid === state.activeTabUid);
        if (sourceIdx < 0) {
          return;
        }
        targetIdx = sourceIdx + (direction === -1 ? -1 : 1);
      } else {
        sourceIdx = tabs.findIndex((t) => t.uid === sourceUid);
        targetIdx = tabs.findIndex((t) => t.uid === targetUid);
      }

      const sourceBoundary = sourceIdx < 0;
      const targetBoundary = targetIdx < 0 || targetIdx >= tabs.length;
      if (sourceBoundary || sourceIdx === targetIdx || targetBoundary) {
        return;
      }

      const [moved] = tabs.splice(sourceIdx, 1);
      tabs.splice(targetIdx, 0, moved);

      state.tabs = tabs;
    }
  }
});

export const {
  addTab,
  updateTab,
  focusTab,
  navigateBack,
  navigateForward,
  switchTab,
  updateRequestPaneTabWidth,
  updateRequestPaneTabHeight,
  updateRequestPaneTab,
  updateResponsePaneTab,
  updateResponsePaneScrollPosition,
  updateRequestBodyScrollPosition,
  updateResponseFormat,
  updateResponseViewTab,
  updateScriptPaneTab,
  closeTabs,
  closeAllCollectionTabs,
  makeTabPermanent,
  reorderTabs
} = tabsSlice.actions;

export default tabsSlice.reducer;
