import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconCategory,
  IconBox,
  IconHome,
  IconChevronDown,
  IconRun,
  IconEye,
  IconSettings,
  IconDots,
  IconEdit,
  IconX,
  IconCheck,
  IconFolder,
  IconUpload,
  IconWorld
} from '@tabler/icons';
import OpenAPISyncIcon from 'components/Icons/OpenAPISync';
import {
  renameWorkspaceAction,
  exportWorkspaceAction
} from 'providers/ReduxStore/slices/workspaces/actions';
import { updateWorkspace } from 'providers/ReduxStore/slices/workspaces';
import { showInFolder } from 'providers/ReduxStore/slices/collections/actions';
import { addTab, focusTab, updateTab } from 'providers/ReduxStore/slices/tabs';
import { setRequestTabView } from 'providers/ReduxStore/slices/requestTabView';
import { uuid } from 'utils/common';
import toast from 'react-hot-toast';
import Dropdown from 'components/Dropdown';
import MenuDropdown from 'ui/MenuDropdown';
import CloseWorkspace from 'components/Sidebar/CloseWorkspace';
import EnvironmentSelector from 'components/Environments/EnvironmentSelector';
import ToolHint from 'components/ToolHint';
import JsSandboxMode from 'components/SecuritySettings/JsSandboxMode';
import ActionIcon from 'ui/ActionIcon';
import { getRevealInFolderLabel } from 'utils/common/platform';
import { normalizePath } from 'utils/common/path';
import classNames from 'classnames';
import StyledWrapper from './StyledWrapper';
import { useTheme } from 'providers/Theme';
import { selectResolvedRequestTabView } from '../../../selectors/requestTabView';

const CollectionHeader = ({ collection, viewMode }) => {
  const dispatch = useDispatch();
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector(
    (state) => state.workspaces.activeWorkspaceUid
  );
  const collections = useSelector((state) => state.collections.collections);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const globalEnvironments = useSelector(
    (state) => state.globalEnvironments.globalEnvironments
  );
  const resolvedRequestTabView = useSelector(selectResolvedRequestTabView);
  const activeTab = tabs.find((tab) => tab.uid === activeTabUid) || null;

  const currentWorkspace = workspaces.find(
    (workspace) => workspace.uid === activeWorkspaceUid
  );
  const activeCollectionContext = viewMode === 'collection' ? collection : null;
  const isHomeView = viewMode === 'home';
  const isAllView = viewMode === 'all';
  const showCollectionActions = !!activeCollectionContext;
  const collectionEnvExcludedTabTypes = new Set([
    'global-environment-settings',
    'workspaceOverview',
    'workspaceEnvironments',
    'preferences',
    'openapi-spec'
  ]);
  const showCollectionEnvironment
    = !!activeTab?.collectionUid
      && !collectionEnvExcludedTabTypes.has(activeTab.type);
  const environmentSelectorCollection = showCollectionEnvironment
    ? collections.find((item) => item.uid === activeTab?.collectionUid)
    || activeCollectionContext
    : null;

  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState('');
  const [workspaceNameError, setWorkspaceNameError] = useState('');
  const [closeWorkspaceModalOpen, setCloseWorkspaceModalOpen] = useState(false);

  const switcherRef = useRef();
  const workspaceActionsRef = useRef();
  const workspaceNameInputRef = useRef(null);
  const workspaceRenameContainerRef = useRef(null);

  const onSwitcherCreate = (ref) => (switcherRef.current = ref);
  const onWorkspaceActionsCreate = (ref) => (workspaceActionsRef.current = ref);

  useEffect(() => {
    if (isHomeView && currentWorkspace?.isNewlyCreated) {
      dispatch(
        updateWorkspace({ uid: currentWorkspace.uid, isNewlyCreated: false })
      );
      setIsRenamingWorkspace(true);
      setWorkspaceNameInput(currentWorkspace.name || '');
      setWorkspaceNameError('');
    }
  }, [
    isHomeView,
    currentWorkspace?.isNewlyCreated,
    currentWorkspace?.uid,
    currentWorkspace?.name,
    dispatch
  ]);

  const handleCancelWorkspaceRename = useCallback(() => {
    setIsRenamingWorkspace(false);
    setWorkspaceNameInput('');
    setWorkspaceNameError('');
  }, []);

  useEffect(() => {
    if (!isRenamingWorkspace) return;

    const handleClickOutside = (event) => {
      if (
        workspaceRenameContainerRef.current
        && !workspaceRenameContainerRef.current.contains(event.target)
      ) {
        handleCancelWorkspaceRename();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    const timer = setTimeout(() => {
      workspaceNameInputRef.current?.focus();
      workspaceNameInputRef.current?.select();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [isRenamingWorkspace, handleCancelWorkspaceRename]);

  const collectionUpdates = useSelector(
    (state) => state.openapiSync?.collectionUpdates || {}
  );
  const { theme } = useTheme();

  const hasOpenApiSyncConfigured
    = activeCollectionContext?.brunoConfig?.openapi?.[0]?.sourceUrl;
  const hasOpenApiUpdates
    = hasOpenApiSyncConfigured
      && collectionUpdates[activeCollectionContext?.uid]?.hasUpdates;
  const hasOpenApiError
    = hasOpenApiSyncConfigured
      && collectionUpdates[activeCollectionContext?.uid]?.error;

  const mountedCollections = collections.filter((mountedCollection) => {
    if (mountedCollection.mountStatus !== 'mounted') return false;

    const isScratch = workspaces.some(
      (workspace) => workspace.scratchCollectionUid === mountedCollection.uid
    );
    if (isScratch) return false;

    const workspaceCollectionPaths
      = currentWorkspace?.collections?.map(
        (workspaceCollection) => workspaceCollection.path
      ) || [];
    return workspaceCollectionPaths.some(
      (workspaceCollectionPath) =>
        normalizePath(mountedCollection.pathname)
        === normalizePath(workspaceCollectionPath)
    );
  });

  const getTabCount = (collectionUid) =>
    tabs.filter((tab) => tab.collectionUid === collectionUid).length;
  const workspaceTabCount = currentWorkspace?.scratchCollectionUid
    ? getTabCount(currentWorkspace.scratchCollectionUid)
    : 0;
  const allTabCount = tabs.filter((tab) => {
    if (
      !resolvedRequestTabView.workspaceCollectionUids.has(tab.collectionUid)
    ) {
      return false;
    }

    return tab.type !== 'workspaceOverview';
  }).length;
  const globalEnvironmentTabUid = currentWorkspace?.scratchCollectionUid
    ? `${currentWorkspace.scratchCollectionUid}-global-environment-settings`
    : null;
  const globalEnvironmentTabCount = globalEnvironmentTabUid
    ? tabs.filter((tab) => tab.uid === globalEnvironmentTabUid).length
    : 0;
  const activeGlobalEnvironmentTab = tabs.find(
    (tab) =>
      tab.uid === activeTabUid && tab.type === 'global-environment-settings'
  );
  const selectedGlobalEnvironment = globalEnvironments.find(
    (environment) =>
      environment.uid === activeGlobalEnvironmentTab?.environmentUid
  );

  const displayName = isHomeView
    ? 'Home'
    : isAllView
      ? 'All'
      : activeCollectionContext?.name || 'Untitled Collection';
  const DisplayIcon = isHomeView
    ? IconHome
    : isAllView
      ? IconCategory
      : IconBox;

  const focusHomeView = () => {
    const scratchCollectionUid = currentWorkspace?.scratchCollectionUid;
    if (!scratchCollectionUid) {
      return;
    }

    dispatch(setRequestTabView({ mode: 'home', collectionUid: null }));

    const homeTabs = tabs.filter(
      (tab) => tab.collectionUid === scratchCollectionUid
    );
    if (homeTabs.length > 0) {
      dispatch(focusTab({ uid: homeTabs[homeTabs.length - 1].uid }));
      return;
    }

    dispatch(
      addTab({
        uid: `${scratchCollectionUid}-overview`,
        collectionUid: scratchCollectionUid,
        type: 'workspaceOverview'
      })
    );
  };

  const focusAllView = () => {
    dispatch(setRequestTabView({ mode: 'all', collectionUid: null }));

    const workspaceCollectionUids
      = resolvedRequestTabView.workspaceCollectionUids;
    const workspaceTabs = tabs.filter((tab) =>
      workspaceCollectionUids.has(tab.collectionUid)
    );

    if (
      workspaceCollectionUids.has(
        resolvedRequestTabView.activeTab?.collectionUid
      )
    ) {
      return;
    }

    if (workspaceTabs.length > 0) {
      dispatch(focusTab({ uid: workspaceTabs[workspaceTabs.length - 1].uid }));
      return;
    }

    const scratchCollectionUid = currentWorkspace?.scratchCollectionUid;
    if (!scratchCollectionUid) {
      return;
    }

    dispatch(
      addTab({
        uid: `${scratchCollectionUid}-overview`,
        collectionUid: scratchCollectionUid,
        type: 'workspaceOverview'
      })
    );
  };

  const handleSwitchToCollection = (targetCollection) => {
    switcherRef.current?.hide();
    if (!targetCollection?.uid) return;

    dispatch(
      setRequestTabView({
        mode: 'collection',
        collectionUid: targetCollection.uid
      })
    );

    const activeCollectionTab = tabs.find(
      (tab) =>
        tab.uid === activeTabUid && tab.collectionUid === targetCollection.uid
    );
    if (activeCollectionTab) {
      dispatch(focusTab({ uid: activeCollectionTab.uid }));
      return;
    }

    const existingTab = tabs.filter(
      (tab) => tab.collectionUid === targetCollection.uid
    );
    if (existingTab.length > 0) {
      dispatch(focusTab({ uid: existingTab[existingTab.length - 1].uid }));
      return;
    }

    dispatch(
      addTab({
        uid: targetCollection.uid,
        collectionUid: targetCollection.uid,
        type: 'collection-settings'
      })
    );
  };

  const handleSwitchToHome = () => {
    switcherRef.current?.hide();
    focusHomeView();
  };

  const handleSwitchToAll = () => {
    switcherRef.current?.hide();
    focusAllView();
  };

  const handleSwitchToGlobalEnvironment = (environment) => {
    switcherRef.current?.hide();

    if (
      !globalEnvironmentTabUid
      || !currentWorkspace?.scratchCollectionUid
      || !environment?.uid
    ) {
      return;
    }

    const existingTab = tabs.find((tab) => tab.uid === globalEnvironmentTabUid);
    if (existingTab) {
      dispatch(
        updateTab({
          uid: globalEnvironmentTabUid,
          environmentUid: environment.uid,
          tabName: environment.name
        })
      );
      dispatch(focusTab({ uid: globalEnvironmentTabUid }));
      return;
    }

    dispatch(
      addTab({
        uid: globalEnvironmentTabUid,
        collectionUid: currentWorkspace.scratchCollectionUid,
        type: 'global-environment-settings',
        environmentUid: environment.uid,
        tabName: environment.name
      })
    );
  };

  const handleRun = () => {
    if (!activeCollectionContext) {
      return;
    }

    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: activeCollectionContext.uid,
        type: 'collection-runner'
      })
    );
  };

  const viewVariables = () => {
    if (!activeCollectionContext) {
      return;
    }

    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: activeCollectionContext.uid,
        type: 'variables'
      })
    );
  };

  const viewCollectionSettings = () => {
    if (!activeCollectionContext) {
      return;
    }

    dispatch(
      addTab({
        uid: activeCollectionContext.uid,
        collectionUid: activeCollectionContext.uid,
        type: 'collection-settings'
      })
    );
  };

  const viewOpenApiSync = () => {
    if (!activeCollectionContext) {
      return;
    }

    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: activeCollectionContext.uid,
        type: 'openapi-sync'
      })
    );
  };

  const overflowMenuItems = [
    {
      id: 'variables',
      label: 'Variables',
      leftSection: IconEye,
      onClick: viewVariables
    },
    ...(!hasOpenApiSyncConfigured
      ? [
          {
            id: 'openapi-sync',
            label: 'OpenAPI',
            leftSection: OpenAPISyncIcon,
            onClick: viewOpenApiSync
          }
        ]
      : []),
    {
      id: 'collection-settings',
      label: 'Collection Settings',
      leftSection: IconSettings,
      onClick: viewCollectionSettings
    }
  ];

  const handleRenameWorkspaceClick = () => {
    workspaceActionsRef.current?.hide();
    setIsRenamingWorkspace(true);
    setWorkspaceNameInput(currentWorkspace?.name || '');
    setWorkspaceNameError('');
  };

  const handleCloseWorkspaceClick = () => {
    workspaceActionsRef.current?.hide();
    setCloseWorkspaceModalOpen(true);
  };

  const handleShowInFolder = () => {
    workspaceActionsRef.current?.hide();
    const pathname = currentWorkspace?.pathname;
    if (pathname) {
      dispatch(showInFolder(pathname)).catch(() => {
        toast.error('Error opening the folder');
      });
    }
  };

  const handleExportWorkspace = () => {
    workspaceActionsRef.current?.hide();
    const uid = currentWorkspace?.uid;
    if (!uid) return;

    dispatch(exportWorkspaceAction(uid))
      .then((result) => {
        if (!result?.canceled) {
          toast.success('Workspace exported successfully');
        }
      })
      .catch((error) => {
        toast.error(error?.message || 'Error exporting workspace');
      });
  };

  const validateWorkspaceName = (name) => {
    const trimmed = name?.trim();
    if (!trimmed) {
      return 'Name is required';
    }
    if (trimmed.length > 255) {
      return 'Must be 255 characters or less';
    }
    return null;
  };

  const handleSaveWorkspaceRename = () => {
    const error = validateWorkspaceName(workspaceNameInput);
    if (error) {
      setWorkspaceNameError(error);
      return;
    }

    const uid = currentWorkspace?.uid;
    if (!uid) return;

    dispatch(renameWorkspaceAction(uid, workspaceNameInput))
      .then(() => {
        toast.success('Workspace renamed!');
        setIsRenamingWorkspace(false);
        setWorkspaceNameInput('');
        setWorkspaceNameError('');
      })
      .catch((err) => {
        toast.error(
          err?.message || 'An error occurred while renaming the workspace'
        );
        setWorkspaceNameError(err?.message || 'Failed to rename workspace');
      });
  };

  const handleWorkspaceNameChange = (e) => {
    setWorkspaceNameInput(e.target.value);
    if (workspaceNameError) {
      setWorkspaceNameError('');
    }
  };

  const handleWorkspaceNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveWorkspaceRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelWorkspaceRename();
    }
  };

  const showWorkspaceActions
    = isHomeView && currentWorkspace && !isRenamingWorkspace;

  return (
    <StyledWrapper>
      {closeWorkspaceModalOpen && currentWorkspace?.uid && (
        <CloseWorkspace
          workspaceUid={currentWorkspace.uid}
          onClose={() => setCloseWorkspaceModalOpen(false)}
        />
      )}

      <div className="flex items-center justify-between gap-2 py-2 px-4">
        <div className="collection-switcher">
          {isRenamingWorkspace ? (
            <div
              className="workspace-rename-container"
              ref={workspaceRenameContainerRef}
            >
              <IconCategory size={18} strokeWidth={1.5} />
              <input
                ref={workspaceNameInputRef}
                type="text"
                className="workspace-name-input"
                value={workspaceNameInput}
                onChange={handleWorkspaceNameChange}
                onKeyDown={handleWorkspaceNameKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <div className="inline-actions">
                <button
                  className="inline-action-btn save"
                  onClick={handleSaveWorkspaceRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Save"
                >
                  <IconCheck size={14} strokeWidth={2} />
                </button>
                <button
                  className="inline-action-btn cancel"
                  onClick={handleCancelWorkspaceRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Cancel"
                >
                  <IconX size={14} strokeWidth={2} />
                </button>
              </div>
              {workspaceNameError && (
                <span className="workspace-error">{workspaceNameError}</span>
              )}
            </div>
          ) : (
            <Dropdown
              placement="bottom-start"
              onCreate={onSwitcherCreate}
              appendTo={() => document.body}
              icon={(
                <button className="switcher-trigger">
                  <DisplayIcon size={18} strokeWidth={1.5} />
                  <span
                    className={classNames('switcher-name', {
                      'scratch-collection': isHomeView || isAllView
                    })}
                  >
                    {displayName}
                  </span>
                  <IconChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className="chevron"
                  />
                </button>
              )}
            >
              {currentWorkspace && (
                <>
                  <div
                    className={classNames('dropdown-item', {
                      'dropdown-item-active': isHomeView
                    })}
                    onClick={handleSwitchToHome}
                  >
                    <div className="dropdown-icon">
                      <IconHome size={16} strokeWidth={1.5} />
                    </div>
                    <span className="dropdown-label">Home</span>
                    {workspaceTabCount > 0 && (
                      <span className="dropdown-tab-count">
                        {workspaceTabCount}
                      </span>
                    )}
                  </div>
                  <div
                    className={classNames('dropdown-item', {
                      'dropdown-item-active': isAllView
                    })}
                    onClick={handleSwitchToAll}
                  >
                    <div className="dropdown-icon">
                      <IconCategory size={16} strokeWidth={1.5} />
                    </div>
                    <span className="dropdown-label">All</span>
                    {allTabCount > 0 && (
                      <span className="dropdown-tab-count">{allTabCount}</span>
                    )}
                  </div>
                  {selectedGlobalEnvironment && (
                    <>
                      <div className="dropdown-separator" />
                      <div className="label-item">Global Variables</div>
                      <div
                        className={classNames('dropdown-item', {
                          'dropdown-item-active':
                            activeTabUid === globalEnvironmentTabUid
                        })}
                        onClick={() =>
                          handleSwitchToGlobalEnvironment(
                            selectedGlobalEnvironment
                          )}
                      >
                        <div className="dropdown-icon">
                          <IconWorld size={16} strokeWidth={1.5} />
                        </div>
                        <span className="dropdown-label">
                          {selectedGlobalEnvironment.name}
                        </span>
                        {globalEnvironmentTabCount > 0 && (
                          <span className="dropdown-tab-count">
                            {globalEnvironmentTabCount}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {mountedCollections.length > 0 && (
                <>
                  <div className="dropdown-separator" />
                  <div className="label-item">Collections</div>
                  {mountedCollections.map((mountedCollection) => {
                    const colTabCount = getTabCount(mountedCollection.uid);
                    return (
                      <div
                        key={mountedCollection.uid}
                        className={classNames('dropdown-item', {
                          'dropdown-item-active':
                            viewMode === 'collection'
                            && collection?.uid === mountedCollection.uid
                        })}
                        onClick={() =>
                          handleSwitchToCollection(mountedCollection)}
                      >
                        <div className="dropdown-icon">
                          <IconBox size={16} strokeWidth={1.5} />
                        </div>
                        <span className="dropdown-label">
                          {mountedCollection.name || 'Untitled Collection'}
                        </span>
                        {colTabCount > 0 && (
                          <span className="dropdown-tab-count">
                            {colTabCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </Dropdown>
          )}

          {showWorkspaceActions && (
            <Dropdown
              placement="bottom-start"
              onCreate={onWorkspaceActionsCreate}
              appendTo={() => document.body}
              icon={(
                <IconDots
                  size={18}
                  strokeWidth={1.5}
                  className="workspace-actions-trigger"
                />
              )}
            >
              <div
                className="dropdown-item"
                onClick={handleRenameWorkspaceClick}
              >
                <div className="dropdown-icon">
                  <IconEdit size={16} strokeWidth={1.5} />
                </div>
                <span>Rename</span>
              </div>
              <div className="dropdown-item" onClick={handleShowInFolder}>
                <div className="dropdown-icon">
                  <IconFolder size={16} strokeWidth={1.5} />
                </div>
                <span>{getRevealInFolderLabel()}</span>
              </div>
              <div className="dropdown-item" onClick={handleExportWorkspace}>
                <div className="dropdown-icon">
                  <IconUpload size={16} strokeWidth={1.5} />
                </div>
                <span>Export</span>
              </div>
              <div
                className="dropdown-item"
                onClick={handleCloseWorkspaceClick}
              >
                <div className="dropdown-icon">
                  <IconX size={16} strokeWidth={1.5} />
                </div>
                <span>Close</span>
              </div>
            </Dropdown>
          )}
        </div>

        <div className="flex flex-grow gap-1.5 items-center justify-end">
          {showCollectionActions && (
            <>
              {hasOpenApiSyncConfigured && (
                <ToolHint
                  text={
                    hasOpenApiError
                      ? 'OpenAPI Error'
                      : hasOpenApiUpdates
                        ? 'OpenAPI Updates Available'
                        : 'OpenAPI'
                  }
                  toolhintId="OpenApiSyncToolhintId"
                  place="bottom"
                >
                  <ActionIcon
                    onClick={viewOpenApiSync}
                    aria-label="OpenAPI"
                    size="sm"
                    className="relative"
                  >
                    <OpenAPISyncIcon size={15} />
                    {(hasOpenApiUpdates || hasOpenApiError) && (
                      <span
                        className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: hasOpenApiError
                            ? theme.status.danger.text
                            : theme.status.warning.text
                        }}
                      />
                    )}
                  </ActionIcon>
                </ToolHint>
              )}
              <ToolHint
                text="Runner"
                toolhintId="RunnerToolhintId"
                place="bottom"
              >
                <ActionIcon onClick={handleRun} aria-label="Runner" size="sm">
                  <IconRun size={16} strokeWidth={1.5} />
                </ActionIcon>
              </ToolHint>
              <JsSandboxMode collection={activeCollectionContext} />
              <MenuDropdown items={overflowMenuItems} placement="bottom-end">
                <ActionIcon
                  label="More actions"
                  size="sm"
                  style={{
                    border: `1px solid ${theme.border.border1}`,
                    borderRadius: theme.border.radius.base,
                    width: 24,
                    marginRight: 4,
                    marginLeft: 4
                  }}
                >
                  <IconDots size={16} strokeWidth={1.5} />
                </ActionIcon>
              </MenuDropdown>
            </>
          )}
          <span>
            <EnvironmentSelector
              collection={environmentSelectorCollection}
              showCollectionEnv={showCollectionEnvironment}
            />
          </span>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default CollectionHeader;
