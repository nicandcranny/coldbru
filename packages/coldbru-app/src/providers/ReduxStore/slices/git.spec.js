import { revertGitFiles } from './git';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const makeState = () => ({
  collections: { collections: [] },
  git: { collectionStates: {} },
  globalEnvironments: {
    globalEnvironments: [{ uid: 'env-1', name: 'Development' }],
    globalEnvironmentDraft: { environmentUid: 'env-1', variables: [] }
  },
  tabs: { activeTabUid: null, tabs: [] },
  workspaces: {
    activeWorkspaceUid: 'workspace-1',
    workspaces: [
      {
        uid: 'workspace-1',
        name: 'Workspace',
        pathname: '/workspace',
        scratchCollectionUid: 'scratch-1'
      }
    ]
  }
});

const runThunk = async (filePaths) => {
  const state = makeState();
  const actions = [];
  const getState = () => state;
  const dispatch = jest.fn((action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }
    actions.push(action);
    return action;
  });

  window.ipcRenderer = {
    invoke: jest.fn((channel) =>
      Promise.resolve(
        channel === 'renderer:revert-git-files'
          ? { reverted: true }
          : { isRepository: true }
      )
    )
  };

  await revertGitFiles('scratch-1', filePaths)(dispatch, getState);
  return actions;
};

describe('revertGitFiles', () => {
  it('clears matching global environment draft after revert', async () => {
    const actions = await runThunk(['environments/Development.yml']);

    expect(actions).toContainEqual({
      type: 'global-environments/clearGlobalEnvironmentDraft'
    });
  });

  it('preserves global environment draft when reverting another file', async () => {
    const actions = await runThunk(['collections/example.bru']);

    expect(actions).not.toContainEqual({
      type: 'global-environments/clearGlobalEnvironmentDraft'
    });
  });
});
