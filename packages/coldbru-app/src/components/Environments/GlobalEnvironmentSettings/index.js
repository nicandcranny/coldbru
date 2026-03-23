import React, { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconCheck, IconFileAlert } from '@tabler/icons';

import EnvironmentDetails from 'components/WorkspaceHome/WorkspaceEnvironments/EnvironmentList/EnvironmentDetails';
import { selectGlobalEnvironment } from 'providers/ReduxStore/slices/global-environments';

const GlobalEnvironmentSettings = ({ environmentUid = null }) => {
  const [, setIsModified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const dispatch = useDispatch();

  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments);
  const activeGlobalEnvironmentUid = useSelector((state) => state.globalEnvironments.activeGlobalEnvironmentUid);

  const environment = useMemo(() => {
    if (environmentUid) {
      return globalEnvironments.find((item) => item.uid === environmentUid) || null;
    }

    return null;
  }, [environmentUid, globalEnvironments]);

  if (!environment) {
    return (
      <div className="h-full w-full flex items-center justify-center flex-col gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <IconFileAlert size={40} strokeWidth={1.5} />
        <div>Global variable not found</div>
      </div>
    );
  }

  const isActive = environment.uid === activeGlobalEnvironmentUid;

  const activateButton = (
    <button
      type="button"
      className={isActive ? 'active-indicator' : ''}
      title={isActive ? 'Active environment' : 'Set active environment'}
      onClick={() => {
        if (!isActive) {
          dispatch(selectGlobalEnvironment({ environmentUid: environment.uid }));
        }
      }}
      disabled={isActive}
    >
      <IconCheck size={15} strokeWidth={2} />
    </button>
  );

  return (
    <EnvironmentDetails
      environment={environment}
      setIsModified={setIsModified}
      originalEnvironmentVariables={environment?.variables || []}
      collection={null}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      isSearchExpanded={isSearchExpanded}
      setIsSearchExpanded={setIsSearchExpanded}
      debouncedSearchQuery={searchQuery}
      searchInputRef={searchInputRef}
      headerActions={activateButton}
    />
  );
};

export default GlobalEnvironmentSettings;
