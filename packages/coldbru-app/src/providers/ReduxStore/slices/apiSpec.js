import { createSlice } from '@reduxjs/toolkit';
import { find } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import path from 'utils/common/path';
import yaml from 'js-yaml';
import toast from 'react-hot-toast';
import { addTab, focusTab, updateTab } from './tabs';
import { setRequestTabView } from './requestTabView';

const initialState = {
  apiSpecs: [],
  activeApiSpecUid: null
};

export const apiSpecSlice = createSlice({
  name: 'apiSpec',
  initialState,
  reducers: {
    apiSpecAddFileEvent: (state, action) => {
      const { name, raw, uid, filename, pathname, json } = action?.payload?.data || {};
      if (!uid) {
        toast.error('Error adding API spec');
      }
      const apiSpec = findApiSpecByUid(state.apiSpecs, uid);
      if (apiSpec) {
        apiSpec.raw = raw;
        apiSpec.name = name;
        apiSpec.filename = filename;
        apiSpec.pathname = pathname;
        apiSpec.json = json;
      } else {
        const newApiSpec = {
          name,
          raw,
          uid,
          filename,
          pathname,
          json
        };
        state.apiSpecs.push(newApiSpec);
      }
      state.activeApiSpecUid = uid;
    },
    apiSpecChangeFileEvent: (state, action) => {
      const { name, raw, uid, filename, pathname, json } = action?.payload?.data || {};
      if (!uid) return;

      const apiSpec = findApiSpecByUid(state.apiSpecs, uid);
      if (apiSpec) {
        apiSpec.raw = raw;
        apiSpec.name = name;
        apiSpec.filename = filename;
        apiSpec.pathname = pathname;
        apiSpec.json = json;
      }
    },
    saveApiSpec: (state, action) => {
      const { content, uid, name, json } = action.payload;
      const apiSpec = findApiSpecByUid(state.apiSpecs, uid);
      if (apiSpec) {
        apiSpec.raw = content;
        if (name) {
          apiSpec.name = name;
        }
        if (json) {
          apiSpec.json = json;
        }
      }
    },
    setActiveApiSpecUid: (state, action) => {
      state.activeApiSpecUid = action.payload.uid;
    },
    removeApiSpec: (state, action) => {
      const { uid } = action.payload;
      let apiSpecIndex = state.apiSpecs.findIndex((c) => c.uid == uid);
      state.apiSpecs = state.apiSpecs.filter((c) => c.uid !== uid);
      let shiftedApiSpec = state.apiSpecs.at(apiSpecIndex);
      let lastApiSpec = state.apiSpecs.at(-1);
      state.activeApiSpecUid = shiftedApiSpec?.uid || lastApiSpec?.uid || null;
    }
  }
});

export const { apiSpecAddFileEvent, apiSpecChangeFileEvent, saveApiSpec, removeApiSpec, setActiveApiSpecUid } = apiSpecSlice.actions;

export default apiSpecSlice.reducer;

const findApiSpecByUid = (apiSpecs, uid) => {
  return find(apiSpecs, (apiSpec) => apiSpec.uid === uid);
};

const getApiSpecTabUid = (uid) => `api-spec:${uid}`;

export const openApiSpecTab = ({ uid }) => (dispatch, getState) => {
  const state = getState();
  const apiSpec = findApiSpecByUid(state.apiSpec.apiSpecs, uid);
  const activeWorkspace = state.workspaces.workspaces.find((w) => w.uid === state.workspaces.activeWorkspaceUid);
  const scratchCollectionUid = activeWorkspace?.scratchCollectionUid;

  if (!apiSpec || !scratchCollectionUid) {
    return;
  }

  const tabUid = getApiSpecTabUid(uid);
  const existingTab = state.tabs.tabs.find((tab) => tab.uid === tabUid);

  dispatch(setActiveApiSpecUid({ uid }));
  dispatch(setRequestTabView({ mode: 'all', collectionUid: null }));

  if (existingTab) {
    dispatch(focusTab({ uid: tabUid }));
    return;
  }

  dispatch(addTab({
    uid: tabUid,
    collectionUid: scratchCollectionUid,
    type: 'api-spec',
    apiSpecUid: uid,
    tabName: apiSpec.name
  }));
};

export const openApiSpec = (workspacePath = null) => (dispatch, getState) => {
  return new Promise((resolve, reject) => {
    const { ipcRenderer } = window;

    if (!workspacePath) {
      const state = getState();
      const activeWorkspace = state.workspaces.workspaces.find((w) => w.uid === state.workspaces.activeWorkspaceUid);
      workspacePath = activeWorkspace?.pathname || null;
    }

    ipcRenderer.invoke('renderer:open-api-spec', workspacePath).then(resolve).catch(reject);
  });
};

export const saveApiSpecToFile
  = ({ uid, content }) =>
    (dispatch, getState) => {
      return new Promise((resolve, reject) => {
        const { ipcRenderer } = window;
        const state = getState();
        const apiSpec = findApiSpecByUid(state.apiSpec.apiSpecs, uid);
        const { pathname } = apiSpec;
        ipcRenderer
          .invoke('renderer:save-api-spec', pathname, content)
          .then(() => {
            dispatch(saveApiSpec({ content, uid }));
            toast.success('Saved API spec successfully!');
            resolve();
          })
          .catch((reject) => {
            toast.error('Error saving file');
            resolve();
          });
      });
    };

export const updateApiSpecTitle
  = ({ uid, title }) =>
    async (dispatch, getState) => {
      const state = getState();
      const apiSpec = findApiSpecByUid(state.apiSpec.apiSpecs, uid);

      if (!apiSpec) {
        throw new Error('API Spec not found');
      }

      const nextTitle = title?.trim();
      if (!nextTitle) {
        throw new Error('Title is required');
      }

      const extension = path.extname(apiSpec.pathname).toLowerCase();
      let parsedSpec = apiSpec.json;

      if (!parsedSpec) {
        parsedSpec = extension === '.json' ? JSON.parse(apiSpec.raw || '{}') : yaml.load(apiSpec.raw || '') || {};
      }

      const nextSpec = cloneDeep(parsedSpec || {});
      nextSpec.info = {
        ...(nextSpec.info || {}),
        title: nextTitle
      };

      const content = extension === '.json'
        ? JSON.stringify(nextSpec, null, 2)
        : yaml.dump(nextSpec, { noRefs: true, lineWidth: -1 });

      await dispatch(saveApiSpecToFile({ uid, content }));
      dispatch(saveApiSpec({ uid, content, name: nextTitle, json: nextSpec }));
      dispatch(updateTab({ uid: getApiSpecTabUid(uid), tabName: nextTitle }));
    };

export const createApiSpecFile = (apiSpecName, apiSpecLocation, content, workspacePath = null) => (dispatch, getState) => {
  const { ipcRenderer } = window;

  if (!workspacePath) {
    const state = getState();
    const activeWorkspace = state.workspaces.workspaces.find((w) => w.uid === state.workspaces.activeWorkspaceUid);
    workspacePath = activeWorkspace?.pathname || null;
  }

  return new Promise((resolve, reject) => {
    ipcRenderer.invoke('renderer:create-api-spec', apiSpecName, apiSpecLocation, content, workspacePath).then(resolve).catch(reject);
  });
};

export const closeApiSpecFile
  = ({ uid }) =>
    (dispatch, getState) => {
      return new Promise((resolve, reject) => {
        const state = getState();
        const apiSpec = findApiSpecByUid(state.apiSpec.apiSpecs, uid);
        if (!apiSpec) {
          return reject(new Error('API Spec not found'));
        }
        if (apiSpec) {
          const { ipcRenderer } = window;

          const activeWorkspace = state.workspaces.workspaces.find((w) => w.uid === state.workspaces.activeWorkspaceUid);
          const workspacePath = activeWorkspace?.pathname || null;

          ipcRenderer
            .invoke('renderer:remove-api-spec', apiSpec.pathname, workspacePath)
            .then(async () => {
              dispatch(removeApiSpec({ uid }));

              if (activeWorkspace) {
                const { loadWorkspaceApiSpecs } = require('./workspaces/actions');
                await dispatch(loadWorkspaceApiSpecs(activeWorkspace.uid));
              }

              resolve();
            })
            .catch((error) => reject(error));
        }
        return;
      });
    };
