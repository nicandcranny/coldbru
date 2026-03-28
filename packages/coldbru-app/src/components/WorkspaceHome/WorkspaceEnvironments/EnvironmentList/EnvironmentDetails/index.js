import { IconCopy, IconTrash, IconX, IconSearch } from '@tabler/icons';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { renameGlobalEnvironment, updateGlobalEnvironmentColor } from 'providers/ReduxStore/slices/global-environments';
import { updateTab } from 'providers/ReduxStore/slices/tabs';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import CopyEnvironment from '../../CopyEnvironment';
import DeleteEnvironment from '../../DeleteEnvironment';
import EnvironmentVariables from './EnvironmentVariables';
import ColorPicker from 'components/ColorPicker';
import InlineEditableTitle from 'components/InlineEditableTitle';
import StyledWrapper from './StyledWrapper';

const EnvironmentDetails = ({ environment, setIsModified, collection, searchQuery, setSearchQuery, isSearchExpanded, setIsSearchExpanded, debouncedSearchQuery, searchInputRef, headerActions = null }) => {
  const dispatch = useDispatch();
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const globalEnvs = useSelector((state) => state?.globalEnvironments?.globalEnvironments);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);

  const validateEnvironmentName = (name) => {
    if (!name || name.trim() === '') {
      return 'Name is required';
    }

    if (name.length < 1) {
      return 'Must be at least 1 character';
    }

    if (name.length > 255) {
      return 'Must be 255 characters or less';
    }

    if (!validateName(name)) {
      return validateNameError(name);
    }

    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = (globalEnvs || []).some((env) =>
      env?.uid !== environment.uid && env?.name?.toLowerCase().trim() === trimmedName);
    if (isDuplicate) {
      return 'Environment already exists';
    }

    return null;
  };

  const handleSaveRename = async (newName) => {
    return dispatch(renameGlobalEnvironment({ name: newName, environmentUid: environment.uid }))
      .then((resolvedUid) => {
        if (activeTabUid) {
          dispatch(updateTab({
            uid: activeTabUid,
            tabName: newName,
            environmentUid: resolvedUid || environment.uid
          }));
        }
        toast.success('Environment renamed!');
      })
      .catch(() => {
        toast.error('An error occurred while renaming the environment');
        throw new Error('An error occurred while renaming the environment');
      });
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSearchBlur = () => {
    if (searchQuery === '') {
      setIsSearchExpanded(false);
    }
  };

  const handleColorChange = (color) => {
    dispatch(updateGlobalEnvironmentColor(environment.uid, color));
  };

  return (
    <StyledWrapper>
      {openDeleteModal && (
        <DeleteEnvironment
          onClose={() => setOpenDeleteModal(false)}
          environment={environment}
        />
      )}
      {openCopyModal && (
        <CopyEnvironment onClose={() => setOpenCopyModal(false)} environment={environment} />
      )}

      <div className="header">
        <div className="title-region">
          <InlineEditableTitle
            value={environment.name}
            validate={validateEnvironmentName}
            onSave={handleSaveRename}
            inputAriaLabel="Edit environment name"
            afterDisplay={<ColorPicker color={environment.color} onChange={handleColorChange} />}
          />
        </div>
        <div className="actions">
          {headerActions}
          {isSearchExpanded ? (
            <div className="search-input-wrapper">
              <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={handleSearchBlur}
                className="search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={handleClearSearch}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Clear search"
                >
                  <IconX size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ) : (
            <button onClick={handleSearchIconClick} title="Search variables">
              <IconSearch size={15} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={() => setOpenCopyModal(true)} title="Copy">
            <IconCopy size={15} strokeWidth={1.5} />
          </button>
          <button onClick={() => setOpenDeleteModal(true)} title="Delete">
            <IconTrash size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="content">
        <EnvironmentVariables
          environment={environment}
          setIsModified={setIsModified}
          collection={collection}
          searchQuery={debouncedSearchQuery}
        />
      </div>
    </StyledWrapper>
  );
};

export default EnvironmentDetails;
