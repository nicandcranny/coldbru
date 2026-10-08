import { createSlice } from '@reduxjs/toolkit';
import get from 'lodash/get';
import { uuid } from 'utils/common';
import path from 'utils/common/path';
import { sanitizeName } from 'utils/common/regex';
import { resolveRequestFilename } from 'utils/common/platform';
import {
  findCollectionByUid,
  findItemInCollection,
  findItemInCollectionByPathname,
  flattenItems,
  getDefaultRequestPaneTab
} from 'utils/collections';
import { insertTaskIntoQueue } from './app';
import { addTab } from './tabs';
import { mountScratchCollection } from './workspaces/actions';

const initialState = {
  // null until loaded from the main process
  entries: null,
  // history entry id -> pathname of the scratch request it was last opened as
  openedPathnames: {}
};

export const requestHistorySlice = createSlice({
  name: 'requestHistory',
  initialState,
  reducers: {
    setRequestHistory: (state, action) => {
      state.entries = action.payload;
    },
    requestHistoryEntryAdded: (state, action) => {
      const { summary, maxEntries } = action.payload;
      if (state.entries) {
        state.entries = [summary, ...state.entries].slice(0, maxEntries);
      }
    },
    requestHistoryEntryDeleted: (state, action) => {
      state.entries = state.entries?.filter((entry) => entry.id !== action.payload);
    },
    requestHistoryEntryOpened: (state, action) => {
      const { id, pathname } = action.payload;
      state.openedPathnames[id] = pathname;
    }
  }
});

export const { setRequestHistory, requestHistoryEntryAdded, requestHistoryEntryDeleted, requestHistoryEntryOpened } = requestHistorySlice.actions;

export const loadRequestHistory = () => async (dispatch) => {
  const entries = await window.ipcRenderer.invoke('renderer:get-request-history');
  dispatch(setRequestHistory(entries));
};

export const deleteRequestHistoryEntry = (id) => async (dispatch) => {
  await window.ipcRenderer.invoke('renderer:delete-request-history-entry', id);
  dispatch(requestHistoryEntryDeleted(id));
};

export const clearRequestHistory = () => async (dispatch) => {
  await window.ipcRenderer.invoke('renderer:clear-request-history');
  dispatch(setRequestHistory([]));
};

// Stores an immutable snapshot of the request as it was when sent, plus its response.
// item/response default to the item's current state (used by gRPC, whose response arrives via events).
export const recordRequestHistory = ({ collectionUid, itemUid, item, response }) => async (dispatch, getState) => {
  try {
    const state = getState();
    const collection = findCollectionByUid(state.collections.collections, collectionUid);
    const stateItem = findItemInCollection(collection, itemUid);
    item = item || stateItem;
    response = response || stateItem.response;
    const request = item.draft ? item.draft.request : item.request;
    const isGrpc = item.type === 'grpc-request';

    const summary = await window.ipcRenderer.invoke('renderer:add-request-history', {
      timestamp: Date.now(),
      method: isGrpc ? 'gRPC' : request.method,
      url: isGrpc ? `${request.url}${request.method || ''}` : request.url,
      item: {
        type: item.type,
        name: item.name,
        request,
        settings: item.settings
      },
      response
    });

    dispatch(requestHistoryEntryAdded({
      summary,
      maxEntries: get(state, 'app.preferences.history.maxEntries', 500)
    }));
  } catch (err) {
    console.error('Failed to record request history', err);
  }
};

// Opens a history entry as a new unsaved request tab in the workspace's scratch collection
// (where the tab bar's + button creates requests), with its response pre-filled
export const openRequestHistoryEntry = (id) => async (dispatch, getState) => {
  // Reuse the request this entry was already opened as, unless it has been edited, saved or deleted since
  const { openedPathnames } = getState().requestHistory;
  if (openedPathnames[id]) {
    for (const c of getState().collections.collections) {
      const openedItem = findItemInCollectionByPathname(c, openedPathnames[id]);
      if (openedItem) {
        if (!openedItem.draft) {
          dispatch(addTab({
            uid: openedItem.uid,
            collectionUid: c.uid,
            requestPaneTab: getDefaultRequestPaneTab(openedItem),
            preview: true
          }));
          return;
        }
        break;
      }
    }
  }

  const entry = await window.ipcRenderer.invoke('renderer:get-request-history-entry', id);
  if (!entry) {
    throw new Error('History entry not found');
  }

  const scratchCollection = await dispatch(mountScratchCollection(getState().workspaces.activeWorkspaceUid));
  const state = getState();
  const collection = scratchCollection && findCollectionByUid(state.collections.collections, scratchCollection.uid);
  const tempDirectory = collection && state.collections.tempDirectories?.[collection.uid];
  if (!tempDirectory) {
    throw new Error('Could not open the scratch workspace for this request');
  }

  // Named after its URL; only the filename needs to be unique
  const name = entry.item.request?.url || entry.item.name;
  const baseFilename = sanitizeName(name.slice(0, 200)) || 'request';
  const takenFilenames = flattenItems(collection.items)
    .filter((i) => i.pathname?.startsWith(tempDirectory))
    .map((i) => i.filename);
  let filename = baseFilename;
  for (let n = 2; takenFilenames.includes(resolveRequestFilename(filename, collection.format)); n++) {
    filename = `${baseFilename} ${n}`;
  }
  const fullName = path.join(tempDirectory, resolveRequestFilename(filename, collection.format));

  await window.ipcRenderer.invoke('renderer:new-request', fullName, {
    ...entry.item,
    uid: uuid(),
    name,
    filename,
    isTransient: true,
    seq: collection.items.length + 1
  });

  dispatch(insertTaskIntoQueue({
    uid: uuid(),
    type: 'OPEN_REQUEST',
    collectionUid: collection.uid,
    itemPathname: fullName,
    preview: true,
    response: entry.response
  }));
  dispatch(requestHistoryEntryOpened({ id, pathname: fullName }));
};

export default requestHistorySlice.reducer;
