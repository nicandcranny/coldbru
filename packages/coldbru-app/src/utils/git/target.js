import { normalizePath } from 'utils/common/path';

const isCollectionInWorkspace = (workspace, collection) => {
  if (!workspace?.collections?.length || !collection?.pathname) {
    return false;
  }

  const normalizedCollectionPath = normalizePath(collection.pathname);

  return workspace.collections.some((workspaceCollection) => {
    if (workspaceCollection.uid && workspaceCollection.uid === collection.uid) {
      return true;
    }

    if (!workspaceCollection.path) {
      return false;
    }

    return normalizePath(workspaceCollection.path) === normalizedCollectionPath;
  });
};

export const getGitTarget = (state, collectionUid = null) => {
  const activeWorkspace = state.workspaces.workspaces.find((workspace) => workspace.uid === state.workspaces.activeWorkspaceUid);
  const activeTab = state.tabs.tabs.find((tab) => tab.uid === state.tabs.activeTabUid);
  const resolvedCollectionUid = collectionUid || activeTab?.collectionUid;

  if (activeWorkspace?.scratchCollectionUid && resolvedCollectionUid === activeWorkspace.scratchCollectionUid && activeWorkspace.pathname) {
    return {
      scopeId: `workspace:${activeWorkspace.uid}`,
      path: activeWorkspace.pathname,
      kind: 'workspace',
      name: activeWorkspace.name,
      collectionUid: resolvedCollectionUid,
      workspaceUid: activeWorkspace.uid
    };
  }

  const collection = state.collections.collections.find((item) => item.uid === resolvedCollectionUid);
  if (!collection?.pathname) {
    return null;
  }

  if (activeWorkspace?.pathname && isCollectionInWorkspace(activeWorkspace, collection)) {
    return {
      scopeId: `workspace:${activeWorkspace.uid}`,
      path: activeWorkspace.pathname,
      kind: 'workspace',
      name: activeWorkspace.name,
      collectionUid: collection.uid,
      workspaceUid: activeWorkspace.uid
    };
  }

  return {
    scopeId: `collection:${collection.uid}`,
    path: collection.pathname,
    kind: 'collection',
    name: collection.name,
    collectionUid: collection.uid,
    workspaceUid: activeWorkspace?.uid || null
  };
};
