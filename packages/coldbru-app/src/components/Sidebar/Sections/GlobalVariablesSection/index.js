import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconCheck, IconDownload, IconPlus, IconSearch, IconUpload, IconWorld } from '@tabler/icons';

import { addTab, focusTab, updateTab } from 'providers/ReduxStore/slices/tabs';
import { selectGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import ActionIcon from 'ui/ActionIcon';
import SidebarSection from 'components/Sidebar/SidebarSection';
import CreateGlobalEnvironment from 'components/WorkspaceHome/WorkspaceEnvironments/CreateEnvironment';
import ImportEnvironmentModal from 'components/Environments/Common/ImportEnvironmentModal';
import ExportEnvironmentModal from 'components/Environments/Common/ExportEnvironmentModal';
import StyledWrapper from './StyledWrapper';

const GlobalVariablesSection = ({ collapsible = true }) => {
  const dispatch = useDispatch();
  const { globalEnvironments, activeGlobalEnvironmentUid } = useSelector((state) => state.globalEnvironments);
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);

  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const environmentItemRefs = useRef({});

  const activeWorkspace = workspaces.find((workspace) => workspace.uid === activeWorkspaceUid);

  const filteredEnvironments = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return globalEnvironments || [];
    }

    return (globalEnvironments || []).filter((environment) => environment?.name?.toLowerCase().includes(query));
  }, [globalEnvironments, searchValue]);

  const handleActivateEnvironment = (event, environmentUid) => {
    event.stopPropagation();
    dispatch(selectGlobalEnvironment({ environmentUid }));
  };

  const openEnvironmentTable = (environment) => {
    const scratchCollectionUid = activeWorkspace?.scratchCollectionUid;

    if (!scratchCollectionUid) {
      return;
    }

    const globalEnvironmentTabUid = `${scratchCollectionUid}-global-environment-settings`;
    const existingTab = tabs.find((tab) => tab.uid === globalEnvironmentTabUid);

    if (existingTab) {
      dispatch(updateTab({
        uid: globalEnvironmentTabUid,
        environmentUid: environment.uid,
        tabName: environment.name
      }));
      dispatch(focusTab({ uid: globalEnvironmentTabUid }));
      return;
    }

    dispatch(addTab({
      uid: globalEnvironmentTabUid,
      collectionUid: scratchCollectionUid,
      type: 'global-environment-settings',
      environmentUid: environment.uid,
      tabName: environment.name
    }));
  };

  const activeGlobalEnvironmentTab = tabs.find((tab) => tab.uid === activeTabUid && tab.type === 'global-environment-settings');
  const activeSidebarEnvironmentUid = activeGlobalEnvironmentTab?.environmentUid;

  useEffect(() => {
    if (!activeSidebarEnvironmentUid) {
      return;
    }

    const element = environmentItemRefs.current[activeSidebarEnvironmentUid];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeSidebarEnvironmentUid]);

  useEffect(() => {
    const handleSidebarSectionOpen = (event) => {
      if (event?.detail?.sectionId !== 'global-variables') {
        return;
      }

      const environmentUid = event?.detail?.focusEnvironmentUid;
      if (!environmentUid) {
        return;
      }

      const element = environmentItemRefs.current[environmentUid];
      if (element) {
        element.scrollIntoView({
          block: 'nearest'
        });
      }
    };

    window.addEventListener('sidebar-section-open', handleSidebarSectionOpen);
    return () => window.removeEventListener('sidebar-section-open', handleSidebarSectionOpen);
  }, []);

  const sectionActions = (
    <>
      <ActionIcon
        onClick={() => {
          setShowSearch((value) => !value);
          if (showSearch) {
            setSearchValue('');
          }
        }}
        label="Search global variables"
      >
        <IconSearch size={14} stroke={1.5} aria-hidden="true" />
      </ActionIcon>
      <ActionIcon onClick={() => setCreateModalOpen(true)} label="Create global environment">
        <IconPlus size={14} stroke={1.5} aria-hidden="true" />
      </ActionIcon>
      <ActionIcon onClick={() => setImportModalOpen(true)} label="Import global environment">
        <IconDownload size={14} stroke={1.5} aria-hidden="true" />
      </ActionIcon>
      <ActionIcon onClick={() => setExportModalOpen(true)} label="Export global environment">
        <IconUpload size={14} stroke={1.5} aria-hidden="true" />
      </ActionIcon>
    </>
  );

  return (
    <>
      {createModalOpen && (
        <CreateGlobalEnvironment
          onClose={() => setCreateModalOpen(false)}
        />
      )}
      {importModalOpen && (
        <ImportEnvironmentModal
          type="global"
          onClose={() => setImportModalOpen(false)}
        />
      )}
      {exportModalOpen && (
        <ExportEnvironmentModal
          onClose={() => setExportModalOpen(false)}
          environments={globalEnvironments || []}
          environmentType="global"
        />
      )}

      <SidebarSection
        id="global-variables"
        title="Global Environments"
        icon={IconWorld}
        actions={sectionActions}
        collapsible={collapsible}
      >
        <StyledWrapper>
          {showSearch && (
            <div className="global-variables-search">
              <input
                type="text"
                className="textbox global-variables-search-input"
                placeholder="Search global environments..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          )}

          <div className="global-variables-list">
            {filteredEnvironments.map((environment) => (
              <button
                key={environment.uid}
                type="button"
                ref={(element) => {
                  if (element) {
                    environmentItemRefs.current[environment.uid] = element;
                  } else {
                    delete environmentItemRefs.current[environment.uid];
                  }
                }}
                className={`global-variable-item ${environment.uid === activeSidebarEnvironmentUid ? 'active' : ''}`}
                onClick={() => openEnvironmentTable(environment)}
              >
                <span className="global-variable-name">{environment.name}</span>
                <span className="global-variable-actions">
                  {environment.uid === activeGlobalEnvironmentUid ? (
                    <span className="global-variable-check active" title="Active environment">
                      <IconCheck size={16} strokeWidth={2} />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="global-variable-check"
                      title="Set active environment"
                      onClick={(event) => handleActivateEnvironment(event, environment.uid)}
                    >
                      <IconCheck size={16} strokeWidth={2} />
                    </button>
                  )}
                </span>
              </button>
            ))}

            {!filteredEnvironments.length && (
              <div className="global-variables-empty">
                {globalEnvironments?.length ? 'No global environments found' : 'No global environments yet'}
              </div>
            )}
          </div>
        </StyledWrapper>
      </SidebarSection>
    </>
  );
};

export default GlobalVariablesSection;
