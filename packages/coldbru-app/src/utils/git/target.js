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

  return {
    scopeId: `collection:${collection.uid}`,
    path: collection.pathname,
    kind: 'collection',
    name: collection.name,
    collectionUid: collection.uid,
    workspaceUid: activeWorkspace?.uid || null
  };
};
