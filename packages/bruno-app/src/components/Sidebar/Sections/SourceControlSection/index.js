import React, { useMemo, useState, useEffect } from 'react';
import { IconRefresh, IconGitCommit, IconMinus, IconPlus, IconArrowBackUp } from '@tabler/icons';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import {
  addGitRemote,
  commitGitChanges,
  initializeGitRepository,
  pushGitChanges,
  revertGitFiles,
  stageGitFiles,
  syncGitChanges,
  unstageGitFiles
} from 'providers/ReduxStore/slices/git';
import Modal from 'components/Modal';
import { isGitRepositoryUrl } from 'utils/git';
import { getGitTarget } from 'utils/git/target';
import useGitStatusMonitor from 'components/Git/useGitStatusMonitor';
import StyledWrapper from './StyledWrapper';

const getFilename = (filePath = '') => filePath.split('/').pop() || filePath;
const getDirectory = (filePath = '') => {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/') || '.';
};

const getChangeStatus = (change) => {
  if (change.type === 'renamed') {
    return 'R';
  }

  if (change.type === 'conflicted') {
    return 'U';
  }

  const primaryStatus = change.type === 'staged' ? change.fileIndex : change.working_dir;
  if (primaryStatus === '?') {
    return 'U';
  }

  return primaryStatus || change.fileIndex || change.working_dir || 'M';
};

const ChangeGroup = ({ title, changes, onToggleStage, onOpenDiff, onRequestRevert, staged, onToggleAll, onRequestRevertAll, loading, showToggleAll = true, showRevert = false }) => {
  if (!changes?.length) {
    return null;
  }

  return (
    <div className="change-group">
      <div className="change-group-header">
        <div className="change-group-title">
          <span>{title}</span>
          <span className="change-group-count">{changes.length}</span>
        </div>
        {showToggleAll ? (
          <div className="change-group-actions">
            {showRevert ? (
              <button
                type="button"
                className="change-icon-button visible"
                onClick={() => onRequestRevertAll(changes)}
                disabled={loading}
                aria-label="Revert all changes"
                title="Revert All Changes"
              >
                <IconArrowBackUp size={14} strokeWidth={1.7} />
              </button>
            ) : null}
            <button
              type="button"
              className="change-icon-button visible"
              onClick={() => onToggleAll(changes)}
              disabled={loading}
              aria-label={staged ? 'Unstage all changes' : 'Stage all changes'}
              title={staged ? 'Unstage All Changes' : 'Stage All Changes'}
            >
              {loading ? (
                <IconRefresh size={14} strokeWidth={1.7} className="is-spinning" />
              ) : staged ? (
                <IconMinus size={14} strokeWidth={1.7} />
              ) : (
                <IconPlus size={14} strokeWidth={1.7} />
              )}
            </button>
          </div>
        ) : null}
      </div>
      <div className="change-list">
        {changes.map((change) => (
          <div key={`${change.type}:${change.path}`} className="change-row">
            <button type="button" className="change-main" onClick={() => onOpenDiff(change)}>
              <div className="change-name">
                <span className="change-filename">{getFilename(change.path)}</span>
                <span className="change-path">{getDirectory(change.path)}</span>
              </div>
            </button>

            <div className="change-actions">
              {showRevert ? (
                <button
                  type="button"
                  className="change-icon-button"
                  onClick={() => onRequestRevert(change)}
                  disabled={change.type === 'conflicted' || loading}
                  aria-label={`Revert ${change.path}`}
                  title="Revert"
                >
                  <IconArrowBackUp size={14} strokeWidth={1.7} />
                </button>
              ) : null}
              <button
                type="button"
                className="change-icon-button"
                disabled={change.type === 'conflicted'}
                onClick={() => onToggleStage(change)}
                aria-label={`${staged ? 'Unstage' : 'Stage'} ${change.path}`}
                title={staged ? 'Unstage' : 'Stage'}
              >
                {loading ? (
                  <IconRefresh size={14} strokeWidth={1.7} className="is-spinning" />
                ) : staged ? (
                  <IconMinus size={14} strokeWidth={1.7} />
                ) : (
                  <IconPlus size={14} strokeWidth={1.7} />
                )}
              </button>
              <span className={`change-status status-${getChangeStatus(change).toLowerCase()}`}>{getChangeStatus(change)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SourceControlSection = () => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const collections = useSelector((state) => state.collections.collections);
  const activeTab = tabs.find((tab) => tab.uid === activeTabUid);
  const activeCollection = collections.find((collection) => collection.uid === activeTab?.collectionUid);
  const gitTarget = useSelector((state) => getGitTarget(state, activeTab?.collectionUid));
  const gitState = useSelector((state) => gitTarget ? state.git.collectionStates[gitTarget.scopeId] : null);
  const [commitMessage, setCommitMessage] = useState('');
  const [revertConfirmation, setRevertConfirmation] = useState(null);
  const [remoteModal, setRemoteModal] = useState(null);
  const [remoteName, setRemoteName] = useState('origin');
  const [remoteUrl, setRemoteUrl] = useState('');

  useGitStatusMonitor(activeTab?.collectionUid, {
    enabled: Boolean(gitTarget?.path)
  });

  useEffect(() => {
    setCommitMessage('');
  }, [gitTarget?.scopeId]);

  useEffect(() => {
    setRemoteName(gitState?.remoteName || 'origin');
    setRemoteUrl(gitState?.gitRepoUrl || '');
  }, [gitState?.remoteName, gitState?.gitRepoUrl, gitTarget?.scopeId]);

  const staged = gitState?.changedFiles?.staged || [];
  const unstaged = gitState?.changedFiles?.unstaged || [];
  const conflicted = gitState?.changedFiles?.conflicted || [];
  const hasStagedChanges = staged.length > 0;
  const hasSyncWork = (gitState?.ahead || 0) > 0 || (gitState?.behind || 0) > 0;
  const isBusy = Boolean(gitState?.loading);
  const needsRemoteSetup = !gitState?.hasRemote && (gitState?.ahead || 0) > 0;
  const primaryAction = hasStagedChanges ? 'commit' : needsRemoteSetup ? 'publish' : hasSyncWork ? 'sync' : null;
  const currentOperation = gitState?.operation;

  const summaryText = useMemo(() => {
    if (!gitState?.isRepository) {
      return null;
    }

    const parts = [];
    if (gitState.currentBranch) {
      parts.push(gitState.currentBranch);
    }
    if (gitState.behind > 0) {
      parts.push(`↓${gitState.behind}`);
    }
    if (gitState.ahead > 0) {
      parts.push(`↑${gitState.ahead}`);
    }
    return parts.join('  ');
  }, [gitState]);

  const handleToggleStage = (change) => {
    if (!activeTab?.collectionUid) {
      return;
    }

    const action = change.type === 'staged' || change.type === 'renamed'
      ? unstageGitFiles
      : stageGitFiles;

    dispatch(action(activeTab.collectionUid, [change.path]));
  };

  const handleToggleAll = (changes, stagedGroup) => {
    if (!activeTab?.collectionUid || !changes?.length) {
      return;
    }

    const action = stagedGroup ? unstageGitFiles : stageGitFiles;
    dispatch(action(activeTab.collectionUid, changes.map((change) => change.path)));
  };

  const handleOpenDiff = (change) => {
    if (!activeCollection?.uid) {
      return;
    }

    dispatch(
      addTab({
        uid: `git-diff:${activeCollection.uid}:${change.type}:${change.path}`,
        collectionUid: activeCollection.uid,
        type: 'git-diff',
        tabName: getFilename(change.path),
        filePath: change.path,
        changeType: change.type,
        from: change.from,
        to: change.to,
        gitScopePath: gitTarget?.path,
        preview: true
      })
    );
  };

  const handleRequestRevert = (changes) => {
    if (!changes?.length) {
      return;
    }

    const isSingleFile = changes.length === 1;
    setRevertConfirmation({
      filePaths: changes.map((change) => change.path),
      title: isSingleFile ? 'Revert File' : 'Revert Changes',
      message: isSingleFile
        ? `Are you sure you want to revert "${getFilename(changes[0].path)}"?`
        : `Are you sure you want to revert ${changes.length} unstaged file(s)?`
    });
  };

  const confirmRevert = async () => {
    if (!revertConfirmation?.filePaths?.length || !activeTab?.collectionUid) {
      setRevertConfirmation(null);
      return;
    }

    await dispatch(revertGitFiles(activeTab.collectionUid, revertConfirmation.filePaths));
    setRevertConfirmation(null);
  };

  const handlePrimaryAction = async () => {
    if (!activeTab?.collectionUid || !primaryAction) {
      return;
    }

    if (primaryAction === 'commit') {
      await dispatch(commitGitChanges(activeTab.collectionUid, commitMessage));
      setCommitMessage('');
      return;
    }

    if (primaryAction === 'publish') {
      setRemoteModal({ shouldPush: true });
      return;
    }

    await dispatch(syncGitChanges(activeTab.collectionUid));
  };

  const handleInitializeRepository = async () => {
    if (!activeTab?.collectionUid) {
      return;
    }

    await dispatch(initializeGitRepository(activeTab.collectionUid));
  };

  const handleSubmitRemote = async () => {
    if (!activeTab?.collectionUid) {
      return;
    }

    const normalizedRemoteUrl = remoteUrl.trim();
    const normalizedRemoteName = remoteName.trim() || 'origin';

    if (!isGitRepositoryUrl(normalizedRemoteUrl)) {
      toast.error('Please enter a valid git repository URL');
      return;
    }

    await dispatch(addGitRemote(activeTab.collectionUid, {
      remoteName: normalizedRemoteName,
      remoteUrl: normalizedRemoteUrl
    }));

    if (remoteModal?.shouldPush) {
      await dispatch(pushGitChanges(activeTab.collectionUid));
    }

    setRemoteModal(null);
  };

  if (!activeCollection?.uid) {
    return (
      <StyledWrapper>
        <div className="source-control-empty">Open a collection to see git changes.</div>
      </StyledWrapper>
    );
  }

  if (gitState && gitState.isRepository === false) {
    return (
      <StyledWrapper>
        <div className="source-control-empty">
          <div>This collection is not inside a git repository.</div>
          <button
            type="button"
            className="source-control-button source-control-empty-action"
            onClick={handleInitializeRepository}
            disabled={isBusy}
          >
            {currentOperation === 'init' ? (
              <IconRefresh size={14} strokeWidth={1.5} className="is-spinning" />
            ) : null}
            Initialize Repository
          </button>
        </div>
      </StyledWrapper>
    );
  }

  if (!gitState) {
    return (
      <StyledWrapper>
        <div className="source-control-empty">Loading repository status...</div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="source-control-header">
        <div>
          <div className="source-control-title">Source Control</div>
          {summaryText ? <div className="source-control-summary">{summaryText}</div> : null}
        </div>
      </div>

      <div className="source-control-composer">
        <textarea
          className="commit-input"
          placeholder="Message (press Commit to create a commit)"
          value={commitMessage}
          onChange={(event) => setCommitMessage(event.target.value)}
          disabled={isBusy}
        />

        <div className="source-control-actions">
          <button
            type="button"
            className="source-control-button"
            disabled={
              isBusy
              || !primaryAction
              || (primaryAction === 'commit' && !commitMessage.trim())
            }
            onClick={handlePrimaryAction}
          >
            {primaryAction === 'commit' ? (
              <IconGitCommit size={14} strokeWidth={1.5} className={currentOperation === 'commit' ? 'is-spinning' : ''} />
            ) : primaryAction === 'publish' ? (
              <IconRefresh size={14} strokeWidth={1.5} className={currentOperation === 'push' || currentOperation === 'add-remote' ? 'is-spinning' : ''} />
            ) : (
              <IconRefresh size={14} strokeWidth={1.5} className={currentOperation === 'sync' ? 'is-spinning' : ''} />
            )}
            {primaryAction === 'commit' ? 'Commit' : primaryAction === 'publish' ? 'Publish' : primaryAction === 'sync' ? 'Sync' : 'Commit'}
          </button>
          {!gitState?.hasRemote ? (
            <button
              type="button"
              className="source-control-button"
              disabled={isBusy}
              onClick={() => setRemoteModal({ shouldPush: false })}
            >
              Add Remote
            </button>
          ) : null}
        </div>
      </div>

      <div className="source-control-body">
        {gitState?.changedFiles?.tooManyFiles ? (
          <div className="source-control-empty">Too many changed files to render in the sidebar.</div>
        ) : (
          <>
            <ChangeGroup
              title="Staged Changes"
              changes={staged}
              staged
              loading={isBusy}
              onToggleAll={(changes) => handleToggleAll(changes, true)}
              onToggleStage={handleToggleStage}
              onOpenDiff={handleOpenDiff}
            />
            <ChangeGroup
              title="Changes"
              changes={unstaged}
              staged={false}
              loading={isBusy}
              onToggleAll={(changes) => handleToggleAll(changes, false)}
              onToggleStage={handleToggleStage}
              onOpenDiff={handleOpenDiff}
              onRequestRevert={(change) => handleRequestRevert([change])}
              onRequestRevertAll={handleRequestRevert}
              showRevert
            />
            <ChangeGroup
              title="Merge Changes"
              changes={conflicted}
              staged={false}
              loading={isBusy}
              onToggleAll={() => {}}
              showToggleAll={false}
              onToggleStage={handleToggleStage}
              onOpenDiff={handleOpenDiff}
            />

            {!staged.length && !unstaged.length && !conflicted.length ? (
              <div className="source-control-empty">No local changes in this repository.</div>
            ) : null}
          </>
        )}
      </div>

      {revertConfirmation ? (
        <Modal
          size="sm"
          title={revertConfirmation.title}
          confirmText="Yes"
          cancelText="No"
          handleCancel={() => setRevertConfirmation(null)}
          handleConfirm={confirmRevert}
          confirmButtonColor="danger"
        >
          <div>{revertConfirmation.message}</div>
        </Modal>
      ) : null}

      {remoteModal ? (
        <Modal
          size="sm"
          title={remoteModal.shouldPush ? 'Publish Repository' : 'Add Remote'}
          confirmText={remoteModal.shouldPush ? 'Add Remote and Push' : 'Add Remote'}
          cancelText="Cancel"
          handleCancel={() => setRemoteModal(null)}
          handleConfirm={handleSubmitRemote}
          confirmDisabled={isBusy || !remoteUrl.trim()}
        >
          <div className="source-control-form">
            <label className="source-control-field">
              <span className="source-control-field-label">Remote Name</span>
              <input
                type="text"
                value={remoteName}
                onChange={(event) => setRemoteName(event.target.value)}
                className="source-control-text-input"
                placeholder="origin"
              />
            </label>

            <label className="source-control-field">
              <span className="source-control-field-label">Remote URL</span>
              <input
                type="text"
                value={remoteUrl}
                onChange={(event) => setRemoteUrl(event.target.value)}
                className="source-control-text-input"
                placeholder="https://github.com/owner/repo.git"
                autoFocus
              />
            </label>
          </div>
        </Modal>
      ) : null}
    </StyledWrapper>
  );
};

export default SourceControlSection;
