import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import { getGitTarget } from 'utils/git/target';

const initialState = {
  collectionStates: {}
};

const operationsToPreserveDuringRefresh = new Set(['commit', 'sync', 'push', 'pull', 'add-remote', 'init']);

const gitSlice = createSlice({
  name: 'git',
  initialState,
  reducers: {
    setCollectionGitState: (state, action) => {
      const { collectionUid, data } = action.payload;
      state.collectionStates[collectionUid] = {
        ...(state.collectionStates[collectionUid] || {}),
        ...data,
        error: null
      };
    },
    setCollectionGitLoading: (state, action) => {
      const { collectionUid, loading, operation = null } = action.payload;
      state.collectionStates[collectionUid] = {
        ...(state.collectionStates[collectionUid] || {}),
        loading,
        operation
      };
    },
    setCollectionGitError: (state, action) => {
      const { collectionUid, error } = action.payload;
      state.collectionStates[collectionUid] = {
        ...(state.collectionStates[collectionUid] || {}),
        loading: false,
        operation: null,
        error
      };
    },
    clearCollectionGitState: (state, action) => {
      delete state.collectionStates[action.payload.collectionUid];
    }
  }
});

export const refreshCollectionGitStatus = (collectionUid, options = {}) => async (dispatch, getState) => {
  const { preserveOperation = false } = options;
  const state = getState();
  const target = getGitTarget(state, collectionUid);
  if (!target?.path) {
    if (collectionUid) {
      dispatch(clearCollectionGitState({ collectionUid }));
    }
    return null;
  }

  const currentGitState = state.git.collectionStates[target.scopeId];

  try {
    if (!currentGitState) {
      dispatch(setCollectionGitLoading({ collectionUid: target.scopeId, loading: true }));
    }
    const data = await window.ipcRenderer.invoke('renderer:get-collection-git-status', {
      collectionPath: target.path
    });

    const latestGitState = getState().git.collectionStates[target.scopeId];
    const shouldPreserveOperation = preserveOperation
      && latestGitState?.loading
      && operationsToPreserveDuringRefresh.has(latestGitState.operation);

    dispatch(
      setCollectionGitState({
        collectionUid: target.scopeId,
        data: {
          loading: shouldPreserveOperation ? latestGitState.loading : false,
          operation: shouldPreserveOperation ? latestGitState.operation : null,
          ...(data || { isRepository: false })
        }
      })
    );

    return data;
  } catch (error) {
    const latestGitState = getState().git.collectionStates[target.scopeId];
    const shouldPreserveOperation = preserveOperation
      && latestGitState?.loading
      && operationsToPreserveDuringRefresh.has(latestGitState.operation);

    if (shouldPreserveOperation) {
      return null;
    }

    dispatch(setCollectionGitError({ collectionUid: target.scopeId, error: error.message || 'Failed to load git status' }));
    return null;
  }
};

const runGitOperation = async ({ dispatch, getState, collectionUid, operation, successMessage, action }) => {
  const state = getState();
  const target = getGitTarget(state, collectionUid);
  if (!target?.path) {
    throw new Error('Collection not found');
  }

  dispatch(setCollectionGitLoading({ collectionUid: target.scopeId, loading: true, operation }));

  try {
    const result = await action(target);
    await dispatch(refreshCollectionGitStatus(collectionUid));
    if (successMessage) {
      toast.success(successMessage);
    }
    return result;
  } catch (error) {
    dispatch(setCollectionGitError({ collectionUid: target.scopeId, error: error.message || `Failed to ${operation}` }));
    toast.error(error.message || `Failed to ${operation}`);
    throw error;
  }
};

export const stageGitFiles = (collectionUid, filePaths) => async (dispatch, getState) => {
  if (!filePaths?.length) {
    return;
  }

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'stage',
    action: (target) => window.ipcRenderer.invoke('renderer:stage-git-files', {
      collectionPath: target.path,
      filePaths
    })
  });
};

export const unstageGitFiles = (collectionUid, filePaths) => async (dispatch, getState) => {
  if (!filePaths?.length) {
    return;
  }

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'unstage',
    action: (target) => window.ipcRenderer.invoke('renderer:unstage-git-files', {
      collectionPath: target.path,
      filePaths
    })
  });
};

export const revertGitFiles = (collectionUid, filePaths) => async (dispatch, getState) => {
  if (!filePaths?.length) {
    return;
  }

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'revert',
    successMessage: filePaths.length === 1 ? 'Changes reverted' : 'All selected changes reverted',
    action: (target) => window.ipcRenderer.invoke('renderer:revert-git-files', {
      collectionPath: target.path,
      filePaths
    })
  });
};

export const commitGitChanges = (collectionUid, message) => async (dispatch, getState) => {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) {
    toast.error('Please enter a commit message');
    return;
  }

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'commit',
    successMessage: 'Commit created',
    action: (target) => window.ipcRenderer.invoke('renderer:commit-git-changes', {
      collectionPath: target.path,
      message: trimmedMessage
    })
  });
};

export const initializeGitRepository = (collectionUid) => async (dispatch, getState) => {
  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'init',
    successMessage: 'Repository initialized',
    action: (target) => window.ipcRenderer.invoke('renderer:init-git-repository', {
      collectionPath: target.path
    })
  });
};

export const addGitRemote = (collectionUid, { remoteName, remoteUrl }) => async (dispatch, getState) => {
  const normalizedRemoteName = remoteName?.trim() || 'origin';
  const normalizedRemoteUrl = remoteUrl?.trim();

  if (!normalizedRemoteUrl) {
    toast.error('Please enter a remote URL');
    return;
  }

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'add-remote',
    successMessage: `Remote ${normalizedRemoteName} added`,
    action: (target) => window.ipcRenderer.invoke('renderer:add-git-remote', {
      collectionPath: target.path,
      remoteName: normalizedRemoteName,
      remoteUrl: normalizedRemoteUrl
    })
  });
};

const getRemoteDetails = (state, collectionUid) => {
  const target = getGitTarget(state, collectionUid);
  const gitState = target ? state.git.collectionStates[target.scopeId] : null;
  return {
    remoteName: gitState?.remoteName || 'origin',
    remoteBranch: gitState?.currentBranch
  };
};

export const pushGitChanges = (collectionUid) => async (dispatch, getState) => {
  const { remoteName, remoteBranch } = getRemoteDetails(getState(), collectionUid);

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'push',
    successMessage: 'Changes pushed',
    action: (target) => window.ipcRenderer.invoke('renderer:push-git-changes', {
      collectionPath: target.path,
      remoteName,
      remoteBranch
    })
  });
};

export const pullGitChanges = (collectionUid) => async (dispatch, getState) => {
  const { remoteName, remoteBranch } = getRemoteDetails(getState(), collectionUid);

  return runGitOperation({
    dispatch,
    getState,
    collectionUid,
    operation: 'pull',
    successMessage: 'Changes pulled',
    action: (target) => window.ipcRenderer.invoke('renderer:pull-git-changes', {
      collectionPath: target.path,
      remoteName,
      remoteBranch,
      strategy: '--no-rebase'
    })
  });
};

export const syncGitChanges = (collectionUid) => async (dispatch, getState) => {
  const state = getState();
  const target = getGitTarget(state, collectionUid);
  const gitState = target ? state.git.collectionStates[target.scopeId] : null;

  if (!target?.path) {
    throw new Error('Collection not found');
  }

  if (!gitState?.hasRemote) {
    toast.error('No remote configured for this repository');
    return;
  }

  dispatch(setCollectionGitLoading({ collectionUid: target.scopeId, loading: true, operation: 'sync' }));

  try {
    if (gitState.behind > 0) {
      await window.ipcRenderer.invoke('renderer:pull-git-changes', {
        collectionPath: target.path,
        remoteName: gitState.remoteName || 'origin',
        remoteBranch: gitState.currentBranch,
        strategy: '--no-rebase'
      });
    }

    if (gitState.ahead > 0) {
      await window.ipcRenderer.invoke('renderer:push-git-changes', {
        collectionPath: target.path,
        remoteName: gitState.remoteName || 'origin',
        remoteBranch: gitState.currentBranch
      });
    }

    await dispatch(refreshCollectionGitStatus(collectionUid));
    toast.success('Repository synchronized');
  } catch (error) {
    dispatch(setCollectionGitError({ collectionUid: target.scopeId, error: error.message || 'Failed to sync repository' }));
    toast.error(error.message || 'Failed to sync repository');
    throw error;
  }
};

export const {
  setCollectionGitState,
  setCollectionGitLoading,
  setCollectionGitError,
  clearCollectionGitState
} = gitSlice.actions;

export default gitSlice.reducer;
