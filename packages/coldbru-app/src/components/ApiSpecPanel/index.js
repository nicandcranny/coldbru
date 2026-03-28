import React, { forwardRef, useRef, useState } from 'react';
import find from 'lodash/find';
import { useSelector, useDispatch } from 'react-redux';
import { IconDots } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import SpecViewer from './SpecViewer';
import Dropdown from 'components/Dropdown';
import { openApiSpec, saveApiSpecToFile, setActiveApiSpecUid, updateApiSpecTitle } from 'providers/ReduxStore/slices/apiSpec';
import CreateApiSpec from 'components/Sidebar/ApiSpecs/CreateApiSpec';
import toast from 'react-hot-toast';
import InlineEditableTitle from 'components/InlineEditableTitle';
import { updateTab } from 'providers/ReduxStore/slices/tabs';

const ApiSpecPanel = ({ apiSpecUid }) => {
  const dispatch = useDispatch();

  const [createApiSpecModalOpen, setCreateApiSpecModalOpen] = useState(false);

  const { apiSpecs, activeApiSpecUid } = useSelector((state) => state.apiSpec);

  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);

  const resolvedApiSpecUid = apiSpecUid || activeApiSpecUid;
  const apiSpec = find(apiSpecs, (c) => c.uid === resolvedApiSpecUid);
  const { filename, pathname, raw, uid } = apiSpec || {};

  React.useEffect(() => {
    if (resolvedApiSpecUid && resolvedApiSpecUid !== activeApiSpecUid) {
      dispatch(setActiveApiSpecUid({ uid: resolvedApiSpecUid }));
    }
  }, [dispatch, resolvedApiSpecUid, activeApiSpecUid]);

  React.useEffect(() => {
    if (uid && apiSpec?.name) {
      dispatch(updateTab({ uid: `api-spec:${uid}`, tabName: apiSpec.name }));
    }
  }, [dispatch, uid, apiSpec?.name]);

  if (!uid) {
    return <div className="p-4 opacity-50">API Spec not found!</div>;
  }

  const MenuIcon = forwardRef((props, ref) => {
    return (
      <div ref={ref}>
        <IconDots size={22} />
      </div>
    );
  });

  const handleOpenApiSpec = () => {
    dispatch(openApiSpec()).catch(
      (err) => console.log(err) && toast.error('An error occurred while opening the API spec')
    );
  };

  return (
    <StyledWrapper className="flex flex-col flex-grow relative">
      {createApiSpecModalOpen ? <CreateApiSpec onClose={() => setCreateApiSpecModalOpen(false)} /> : null}
      <div className="panel-header">
        <div className="panel-title">
          <InlineEditableTitle
            value={apiSpec.name || filename}
            onSave={(title) => dispatch(updateApiSpecTitle({ uid, title }))}
            validate={(title) => (!title || !title.trim() ? 'Title is required' : null)}
            inputAriaLabel="Edit API spec title"
          />
          <div className="panel-path" title={pathname}>
            {filename}
          </div>
        </div>
        <div className="menu-icon">
          <Dropdown onCreate={onDropdownCreate} icon={<MenuIcon />} placement="bottom-start">
            <div
              className="dropdown-item"
              onClick={(e) => {
                dropdownTippyRef.current.hide();
                setCreateApiSpecModalOpen(true);
              }}
            >
              Create API Spec
            </div>
            <div
              className="dropdown-item"
              onClick={(e) => {
                dropdownTippyRef.current.hide();
                handleOpenApiSpec();
              }}
            >
              Open API Spec
            </div>
          </Dropdown>
        </div>
      </div>
      <SpecViewer
        content={raw}
        onSave={(content) => dispatch(saveApiSpecToFile({ uid, content }))}
      />
    </StyledWrapper>
  );
};

export default ApiSpecPanel;
