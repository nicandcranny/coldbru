const { ipcMain } = require('electron');
const path = require('path');
const {
  cloneGitRepository,
  commitChanges,
  discardChanges,
  fetchRemotes,
  getAheadBehindCount,
  getChangedFilesInCollectionGit,
  getCollectionGitRootPath,
  getCurrentGitBranch,
  getRenamedFileDiff,
  getStagedFileDiff,
  getUnstagedFileDiff,
  pullGitChanges,
  pushGitChanges,
  stageChanges,
  unstageChanges
} = require('../utils/git');
const { createDirectory, removeDirectory } = require('../utils/filesystem');

const registerGitIpc = (mainWindow) => {
  ipcMain.handle('renderer:clone-git-repository', async (event, { url, path, processUid }) => {
    let directoryCreated = false;
    try {
      await createDirectory(path);
      directoryCreated = true;
      await cloneGitRepository(mainWindow, { url, path, processUid });
      return 'Repository cloned successfully';
    } catch (error) {
      if (directoryCreated) {
        await removeDirectory(path);
      }
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-collection-git-status', async (event, { collectionPath }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      return {
        isRepository: false
      };
    }

    const [changedFiles, aheadBehind, remotes] = await Promise.all([
      getChangedFilesInCollectionGit(gitRootPath, collectionPath),
      getAheadBehindCount(gitRootPath),
      fetchRemotes(gitRootPath).catch(() => [])
    ]);

    let currentBranch = null;
    try {
      currentBranch = await getCurrentGitBranch(gitRootPath);
    } catch (error) {
      currentBranch = null;
    }

    const primaryRemote = remotes[0];

    return {
      isRepository: true,
      gitRootPath,
      currentBranch,
      remoteName: primaryRemote?.name || null,
      gitRepoUrl: primaryRemote?.refs?.fetch || primaryRemote?.refs?.push || null,
      hasRemote: remotes.length > 0,
      changedFiles,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind
    };
  });

  ipcMain.handle('renderer:get-working-git-file-diff', async (event, { collectionPath, filePath, changeType, from, to }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    if (changeType === 'renamed') {
      return {
        unifiedDiff: await getRenamedFileDiff(gitRootPath, { from, to }),
        gitRootPath
      };
    }

    if (changeType === 'staged') {
      return {
        unifiedDiff: await getStagedFileDiff(gitRootPath, filePath),
        gitRootPath
      };
    }

    return {
      unifiedDiff: await getUnstagedFileDiff(gitRootPath, path.join(gitRootPath, filePath)),
      gitRootPath
    };
  });

  ipcMain.handle('renderer:stage-git-files', async (event, { collectionPath, filePaths }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    return stageChanges(gitRootPath, filePaths);
  });

  ipcMain.handle('renderer:unstage-git-files', async (event, { collectionPath, filePaths }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    const absolutePaths = filePaths.map((filePath) => path.join(gitRootPath, filePath));
    return unstageChanges(gitRootPath, absolutePaths);
  });

  ipcMain.handle('renderer:revert-git-files', async (event, { collectionPath, filePaths }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    const absolutePaths = filePaths.map((filePath) => path.join(gitRootPath, filePath));
    return discardChanges(gitRootPath, absolutePaths);
  });

  ipcMain.handle('renderer:commit-git-changes', async (event, { collectionPath, message }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    return commitChanges(gitRootPath, message);
  });

  ipcMain.handle('renderer:push-git-changes', async (event, { collectionPath, remoteName = 'origin', remoteBranch }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    return pushGitChanges(mainWindow, {
      gitRootPath,
      processUid: `push-${Date.now()}`,
      remote: remoteName,
      remoteBranch
    });
  });

  ipcMain.handle('renderer:pull-git-changes', async (event, { collectionPath, remoteName = 'origin', remoteBranch, strategy = '--no-rebase' }) => {
    const gitRootPath = getCollectionGitRootPath(collectionPath);
    if (!gitRootPath) {
      throw new Error('Not a git repository');
    }

    return pullGitChanges(mainWindow, {
      gitRootPath,
      processUid: `pull-${Date.now()}`,
      remote: remoteName,
      remoteBranch,
      strategy
    });
  });
};

module.exports = registerGitIpc;
