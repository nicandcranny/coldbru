import React, { useMemo, useState, useRef, forwardRef, useEffect } from 'react';
import find from 'lodash/find';
import Dropdown from 'components/Dropdown';
import { IconWorld, IconDatabase, IconCaretDown } from '@tabler/icons';
import { useSelector, useDispatch } from 'react-redux';
import { addTab, focusTab, updateTab } from 'providers/ReduxStore/slices/tabs';
import { setRequestTabView } from 'providers/ReduxStore/slices/requestTabView';
import { selectEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { selectGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';
import toast from 'react-hot-toast';
import EnvironmentListContent from './EnvironmentListContent/index';
import CreateEnvironment from '../EnvironmentSettings/CreateEnvironment';
import ImportEnvironmentModal from 'components/Environments/Common/ImportEnvironmentModal';
import CreateGlobalEnvironment from 'components/WorkspaceHome/WorkspaceEnvironments/CreateEnvironment';
import ToolHint from 'components/ToolHint';
import StyledWrapper from './StyledWrapper';
import { transparentize } from 'polished';

const TABS = [
  { id: 'collection', label: 'Collection', icon: <IconDatabase size={16} strokeWidth={1.5} /> },
  { id: 'global', label: 'Global', icon: <IconWorld size={16} strokeWidth={1.5} /> }
];

const EMPTY_STATE_DESCRIPTIONS = {
  collection: 'Create your first environment to begin working with your collection.',
  global: 'Create your first global environment to begin working across collections.'
};

/**
 * Generates background color with transparency for environment badges
 */
const getEnvBackgroundColor = (color) => (color ? transparentize(1 - 0.12, color) : 'transparent');

/**
 * Calculates the style for an environment badge section
 */
const getEnvBadgeStyle = (environment, position, hasOtherEnv) => {
  const color = environment?.color;
  const isLeft = position === 'left';

  // Determine border radius based on position and whether other env exists
  let borderRadius = '0.3rem';
  if (hasOtherEnv) {
    borderRadius = isLeft ? '0.3rem 0 0 0.3rem' : '0 0.3rem 0.3rem 0';
  }

  // Determine padding based on position
  const padding = isLeft
    ? hasOtherEnv
      ? '0.25rem 0.5rem 0.25rem 0.5rem'
      : '0.25rem 0.3rem 0.25rem 0.5rem'
    : '0.25rem 0.3rem 0.25rem 0.5rem';

  return {
    backgroundColor: getEnvBackgroundColor(color),
    padding,
    borderRadius
  };
};

/**
 * Calculates dropdown width based on longest environment name
 */
const calculateDropdownWidth = (environments, globalEnvironments) => {
  const allEnvironments = [...environments, ...globalEnvironments];
  if (allEnvironments.length === 0) return 0;

  const maxCharLength = Math.max(...allEnvironments.map((env) => env.name?.length || 0));
  // 8 pixels per character (rough estimate for average character width)
  return maxCharLength * 8;
};

/**
 * Displays a single environment with icon, name, and optional color styling
 */
const EnvironmentBadge = ({ environment, icon: Icon, placeholder }) => {
  const colorStyle = environment?.color ? { color: environment.color } : {};

  if (!environment) {
    return (
      <>
        <Icon size={14} strokeWidth={1.5} className="env-icon" />
        <span className="env-text env-text-placeholder truncate overflow-hidden">
          {placeholder}
        </span>
      </>
    );
  }

  return (
    <>
      <Icon size={14} strokeWidth={1.5} className="env-icon" style={colorStyle} />
      <ToolHint
        text={environment.name}
        toolhintId={`env-${environment.uid}`}
        place="bottom-start"
        delayShow={1000}
        hidden={environment.name?.length < 7}
      >
        <span className="env-text truncate overflow-hidden" style={colorStyle}>
          {environment.name}
        </span>
      </ToolHint>
    </>
  );
};

/**
 * Dropdown trigger component showing active environments
 */
const DropdownTrigger = forwardRef(({ collectionEnv, globalEnv, showCollectionEnv }, ref) => {
  const hasNoVisibleEnvironments = showCollectionEnv ? (!collectionEnv && !globalEnv) : !globalEnv;

  return (
    <div
      ref={ref}
      className={`current-environment flex align-center justify-start cursor-pointer bg-transparent ${
        hasNoVisibleEnvironments ? 'no-environments' : ''
      }`}
      style={{ padding: 0 }}
      data-testid="environment-selector-trigger"
    >
      {showCollectionEnv && (
        <>
          <div className="flex items-center min-w-0" style={getEnvBadgeStyle(collectionEnv, 'left', true)}>
            <EnvironmentBadge
              environment={collectionEnv}
              icon={IconDatabase}
              placeholder="Collection"
            />
          </div>

          <div className="env-separator" style={{ width: '1px', alignSelf: 'stretch' }} />
        </>
      )}

      <div className="flex items-center min-w-0" style={getEnvBadgeStyle(globalEnv, 'right', true)}>
        <EnvironmentBadge
          environment={globalEnv}
          icon={IconWorld}
          placeholder="Global"
        />
        <IconCaretDown className="caret flex items-center justify-center" size={12} strokeWidth={2} />
      </div>
    </div>
  );
});

const EnvironmentSelector = ({ collection, showCollectionEnv = true }) => {
  const dispatch = useDispatch();
  const dropdownTippyRef = useRef();
  const [activeTab, setActiveTab] = useState(showCollectionEnv ? 'collection' : 'global');
  const [showCreateGlobalModal, setShowCreateGlobalModal] = useState(false);
  const [showImportGlobalModal, setShowImportGlobalModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [showImportCollectionModal, setShowImportCollectionModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const tabs = useSelector((state) => state.tabs.tabs);
  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments);
  const activeGlobalEnvironmentUid = useSelector((state) => state.globalEnvironments.activeGlobalEnvironmentUid);
  const activeGlobalEnvironment = activeGlobalEnvironmentUid
    ? find(globalEnvironments, (e) => e.uid === activeGlobalEnvironmentUid)
    : null;
  const activeWorkspace = workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null;

  const safeCollection = collection || {
    uid: null,
    environments: [],
    activeEnvironmentUid: null
  };

  const environments = safeCollection.environments || [];
  const activeEnvironmentUid = safeCollection.activeEnvironmentUid;
  const activeCollectionEnvironment = activeEnvironmentUid
    ? find(environments, (e) => e.uid === activeEnvironmentUid)
    : null;
  const visibleTabs = showCollectionEnv ? TABS : TABS.filter((tab) => tab.id === 'global');

  const dropdownWidth = useMemo(
    () => calculateDropdownWidth(showCollectionEnv ? environments : [], globalEnvironments),
    [environments, globalEnvironments, showCollectionEnv]
  );
  const visibleEnvironments = useMemo(() => {
    const currentEnvironments = activeTab === 'collection' ? environments : globalEnvironments;
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return currentEnvironments;
    }

    return currentEnvironments.filter((env) => env?.name?.toLowerCase().includes(normalizedSearch));
  }, [activeTab, environments, globalEnvironments, searchText]);

  const description = EMPTY_STATE_DESCRIPTIONS[activeTab];

  useEffect(() => {
    setSearchText('');
  }, [activeTab]);

  useEffect(() => {
    if ((!showCollectionEnv || !safeCollection.uid) && activeTab === 'collection') {
      setActiveTab('global');
    }
  }, [activeTab, safeCollection.uid, showCollectionEnv]);

  const hideDropdown = () => {
    setSearchText('');
    dropdownTippyRef.current?.hide();
  };

  const handleEnvironmentSelect = (environment) => {
    const action
      = activeTab === 'collection'
        ? selectEnvironment(environment?.uid || null, safeCollection.uid)
        : selectGlobalEnvironment({ environmentUid: environment?.uid || null });

    dispatch(action)
      .then(() => {
        toast.success(environment ? `Environment changed to ${environment.name}` : 'No Environments are active now');
        hideDropdown();
      })
      .catch(() => {
        toast.error('An error occurred while selecting the environment');
      });
  };

  const openGlobalEnvironmentSettingsTab = () => {
    const scratchCollectionUid = activeWorkspace?.scratchCollectionUid;
    const environmentToOpen = activeGlobalEnvironment || globalEnvironments[0];

    if (!scratchCollectionUid || !environmentToOpen?.uid) {
      return;
    }

    const globalEnvironmentTabUid = `${scratchCollectionUid}-global-environment-settings`;

    dispatch(setRequestTabView({ mode: 'home', collectionUid: null }));

    const existingTab = find(tabs, (tab) => tab.uid === globalEnvironmentTabUid);

    if (existingTab) {
      dispatch(updateTab({
        uid: globalEnvironmentTabUid,
        environmentUid: environmentToOpen.uid,
        tabName: environmentToOpen.name
      }));
      dispatch(focusTab({ uid: globalEnvironmentTabUid }));
      return;
    }

    dispatch(addTab({
      uid: globalEnvironmentTabUid,
      collectionUid: scratchCollectionUid,
      type: 'global-environment-settings',
      environmentUid: environmentToOpen.uid,
      tabName: environmentToOpen.name
    }));
  };

  const handleSettingsClick = () => {
    const isCollection = activeTab === 'collection';
    if (!isCollection || !safeCollection.uid) {
      openGlobalEnvironmentSettingsTab();
      hideDropdown();
      return;
    }

    dispatch(
      addTab({
        uid: `${safeCollection.uid}-${isCollection ? 'environment' : 'global-environment'}-settings`,
        collectionUid: safeCollection.uid,
        type: isCollection ? 'environment-settings' : 'global-environment-settings'
      })
    );
    hideDropdown();
  };

  const handleCreateClick = () => {
    if (activeTab === 'collection') {
      setShowCreateCollectionModal(true);
    } else {
      setShowCreateGlobalModal(true);
    }
    hideDropdown();
  };

  const handleImportClick = () => {
    if (activeTab === 'collection') {
      setShowImportCollectionModal(true);
    } else {
      setShowImportGlobalModal(true);
    }
    hideDropdown();
  };

  const openEnvironmentSettingsTab = (type) => {
    if (!safeCollection.uid) {
      return;
    }

    dispatch(
      addTab({
        uid: `${safeCollection.uid}-${type}-settings`,
        collectionUid: safeCollection.uid,
        type: `${type}-settings`
      })
    );
  };

  return (
    <StyledWrapper width={dropdownWidth}>
      <div className="environment-selector flex align-center cursor-pointer">
        <Dropdown
          onCreate={(ref) => (dropdownTippyRef.current = ref)}
          icon={(
            <DropdownTrigger
              collectionEnv={activeCollectionEnvironment}
              globalEnv={activeGlobalEnvironment}
              showCollectionEnv={showCollectionEnv}
            />
          )}
          placement="bottom-end"
        >
          {/* Tab Headers */}
          <div className="tab-header flex pt-3 pb-2 px-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button whitespace-nowrap pb-[0.375rem] border-b-[0.125rem] bg-transparent flex align-center cursor-pointer transition-all duration-200 mr-[1.25rem] ${
                  activeTab === tab.id ? 'active' : 'inactive'
                }`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`env-tab-${tab.id}`}
              >
                <span className="tab-content-wrapper">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            <EnvironmentListContent
              environments={visibleEnvironments}
              hasEnvironments={(activeTab === 'collection' ? environments : globalEnvironments).length > 0}
              activeEnvironmentUid={activeTab === 'collection' ? activeEnvironmentUid : activeGlobalEnvironmentUid}
              description={description}
              searchText={searchText}
              setSearchText={setSearchText}
              onEnvironmentSelect={handleEnvironmentSelect}
              onSettingsClick={handleSettingsClick}
              onCreateClick={handleCreateClick}
              onImportClick={handleImportClick}
            />
          </div>
        </Dropdown>
      </div>

      {showCreateGlobalModal && (
        <CreateGlobalEnvironment
          onClose={() => setShowCreateGlobalModal(false)}
          onEnvironmentCreated={openGlobalEnvironmentSettingsTab}
        />
      )}

      {showImportGlobalModal && (
        <ImportEnvironmentModal
          type="global"
          onClose={() => setShowImportGlobalModal(false)}
          onEnvironmentCreated={openGlobalEnvironmentSettingsTab}
        />
      )}

      {showCreateCollectionModal && (
        <CreateEnvironment
          collection={safeCollection}
          onClose={() => setShowCreateCollectionModal(false)}
          onEnvironmentCreated={() => openEnvironmentSettingsTab('environment')}
        />
      )}

      {showImportCollectionModal && (
        <ImportEnvironmentModal
          type="collection"
          collection={safeCollection}
          onClose={() => setShowImportCollectionModal(false)}
          onEnvironmentCreated={() => openEnvironmentSettingsTab('environment')}
        />
      )}
    </StyledWrapper>
  );
};

export default EnvironmentSelector;
