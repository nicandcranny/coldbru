import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import find from 'lodash/find';
import { IconSettings, IconCookie, IconTool, IconSearch, IconPalette, IconBrandGithub, IconGitBranch, IconRefresh } from '@tabler/icons';
import ToolHint from 'components/ToolHint';
import Cookies from 'components/Cookies';
import Notifications from 'components/Notifications';
import Portal from 'components/Portal';
import ThemeDropdown from './ThemeDropdown';
import { openConsole } from 'providers/ReduxStore/slices/logs';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import { useApp } from 'providers/App';
import useGitStatusMonitor from 'components/Git/useGitStatusMonitor';
import { syncGitChanges } from 'providers/ReduxStore/slices/git';
import { getGitTarget } from 'utils/git/target';
import StyledWrapper from './StyledWrapper';

const StatusBar = () => {
  const dispatch = useDispatch();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const activeTab = find(tabs, (t) => t.uid === activeTabUid);
  const collections = useSelector((state) => state.collections.collections);
  const logs = useSelector((state) => state.logs.logs);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const { version } = useApp();

  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);
  const activeCollection = collections.find((collection) => collection.uid === activeTab?.collectionUid);
  const gitTarget = useSelector((state) => getGitTarget(state, activeTab?.collectionUid));
  const gitState = useSelector((state) => gitTarget ? state.git.collectionStates[gitTarget.scopeId] : null);

  const errorCount = logs.filter((log) => log.type === 'error').length;

  useGitStatusMonitor(activeTab?.collectionUid, {
    enabled: Boolean(gitTarget?.path)
  });

  const handleConsoleClick = () => {
    dispatch(openConsole());
  };

  const handlePreferencesClick = () => {
    const collectionUid = activeTab?.collectionUid || activeWorkspace?.scratchCollectionUid;

    dispatch(
      addTab({
        type: 'preferences',
        uid: collectionUid ? `${collectionUid}-preferences` : 'preferences',
        collectionUid: collectionUid
      })
    );
  };

  const openGlobalSearch = () => {
    window.dispatchEvent(new CustomEvent('global-search-open'));
  };

  const openSourceControl = () => {
    window.dispatchEvent(new CustomEvent('sidebar-section-open', {
      detail: {
        sectionId: 'source-control'
      }
    }));
  };

  const branchText = gitState?.currentBranch
    ? `${gitState.currentBranch}${gitState.behind > 0 ? ` ↓${gitState.behind}` : ''}${gitState.ahead > 0 ? ` ↑${gitState.ahead}` : ''}`
    : null;

  return (
    <StyledWrapper>
      {cookiesOpen && (
        <Portal>
          <Cookies
            onClose={() => {
              setCookiesOpen(false);
              document.querySelector('[data-trigger="cookies"]').focus();
            }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="cookies-title"
            aria-describedby="cookies-description"
          />
        </Portal>
      )}

      <div className="status-bar">
        <div className="status-bar-section">
          <div className="status-bar-group">
            {gitState?.isRepository && branchText ? (
              <>
                <button
                  className="status-bar-button"
                  onClick={openSourceControl}
                  tabIndex={0}
                  aria-label="Open Source Control"
                >
                  <div className="console-button-content">
                    <IconGitBranch size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span className="console-label">{branchText}</span>
                  </div>
                </button>

                <button
                  className="status-bar-button"
                  onClick={() => dispatch(syncGitChanges(activeCollection.uid))}
                  tabIndex={0}
                  disabled={gitState.loading || !gitState.hasRemote || ((gitState.ahead || 0) === 0 && (gitState.behind || 0) === 0)}
                  aria-label="Sync repository"
                >
                  <div className="console-button-content">
                    <IconRefresh size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span className="console-label">Sync</span>
                  </div>
                </button>

                <div className="status-bar-divider"></div>
              </>
            ) : null}

            <ToolHint text="Preferences" toolhintId="Preferences" place="top-start" offset={10}>
              <button
                className="status-bar-button preferences-button"
                data-trigger="preferences"
                onClick={handlePreferencesClick}
                tabIndex={0}
                aria-label="Open Preferences"
              >
                <IconSettings size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </ToolHint>

            <ThemeDropdown>
              <button
                className="status-bar-button"
                data-trigger="theme"
                tabIndex={0}
                aria-label="Change Theme"
              >
                <IconPalette size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </ThemeDropdown>

            <ToolHint text="Notifications" toolhintId="Notifications" place="top" offset={10}>
              <div className="status-bar-button">
                <Notifications />
              </div>
            </ToolHint>

            <ToolHint text="GitHub Repository" toolhintId="GitHub" place="top" offset={10}>
              <button
                className="status-bar-button"
                onClick={() => {
                  window?.ipcRenderer?.openExternal('https://github.com/nicandcranny/coldbru');
                }}
                tabIndex={0}
                aria-label="Open GitHub Repository"
              >
                <IconBrandGithub size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </ToolHint>
          </div>
        </div>

        <div className="status-bar-section">
          <div className="flex items-center gap-3">
            <button
              className="status-bar-button"
              data-trigger="search"
              onClick={openGlobalSearch}
              tabIndex={0}
              aria-label="Global Search"
            >
              <div className="console-button-content">
                <IconSearch size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Search</span>
              </div>
            </button>

            <button
              className="status-bar-button"
              data-trigger="cookies"
              onClick={() => setCookiesOpen(true)}
              tabIndex={0}
              aria-label="Open Cookies"
            >
              <div className="console-button-content">
                <IconCookie size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Cookies</span>
              </div>
            </button>

            <button
              className={`status-bar-button ${errorCount > 0 ? 'has-errors' : ''}`}
              data-trigger="dev-tools"
              onClick={handleConsoleClick}
              tabIndex={0}
              aria-label={`Open Dev Tools${errorCount > 0 ? ` (${errorCount} errors)` : ''}`}
            >
              <div className="console-button-content">
                <IconTool size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Dev Tools</span>
                {errorCount > 0 && (
                  <span className="error-count-inline">{errorCount}</span>
                )}
              </div>
            </button>

            <div className="status-bar-divider"></div>

            <div className="status-bar-version">
              v{version}
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default StatusBar;
