import React from 'react';
import classnames from 'classnames';
import { updatedFolderSettingsSelectedTab } from 'providers/ReduxStore/slices/collections';
import { renameItem } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import Headers from './Headers';
import Script from './Script';
import Tests from './Tests';
import StyledWrapper from './StyledWrapper';
import Vars from './Vars';
import Documentation from './Documentation';
import Auth from './Auth';
import StatusDot from 'components/StatusDot';
import get from 'lodash/get';
import InlineEditableTitle from 'components/InlineEditableTitle';

const FolderSettings = ({ collection, folder }) => {
  const dispatch = useDispatch();
  let tab = 'headers';
  const { folderLevelSettingsSelectedTab } = collection;
  if (folderLevelSettingsSelectedTab?.[folder?.uid]) {
    tab = folderLevelSettingsSelectedTab[folder?.uid];
  }

  const folderRoot = folder?.draft || folder?.root;
  const hasScripts = folderRoot?.request?.script?.res || folderRoot?.request?.script?.req;
  const hasTests = folderRoot?.request?.tests;

  const headers = folderRoot?.request?.headers || [];
  const activeHeadersCount = headers.filter((header) => header.enabled).length;

  const requestVars = folderRoot?.request?.vars?.req || [];
  const responseVars = folderRoot?.request?.vars?.res || [];
  const activeVarsCount = requestVars.filter((v) => v.enabled).length + responseVars.filter((v) => v.enabled).length;

  const auth = get(folderRoot, 'request.auth.mode');
  const hasAuth = auth && auth !== 'none';

  const setTab = (tab) => {
    dispatch(
      updatedFolderSettingsSelectedTab({
        collectionUid: collection?.uid,
        folderUid: folder?.uid,
        tab
      })
    );
  };

  const getTabPanel = (tab) => {
    switch (tab) {
      case 'headers': {
        return <Headers collection={collection} folder={folder} />;
      }
      case 'script': {
        return <Script collection={collection} folder={folder} />;
      }
      case 'test': {
        return <Tests collection={collection} folder={folder} />;
      }
      case 'vars': {
        return <Vars collection={collection} folder={folder} />;
      }
      case 'auth': {
        return <Auth collection={collection} folder={folder} />;
      }
      case 'docs': {
        return <Documentation collection={collection} folder={folder} />;
      }
    }
  };

  const getTabClassname = (tabName) => {
    return classnames(`tab select-none ${tabName}`, {
      active: tabName === tab
    });
  };

  const handleRenameFolder = async (newName) => {
    return dispatch(renameItem({
      itemUid: folder.uid,
      collectionUid: collection.uid,
      newName
    }))
      .catch((err) => {
        throw new Error(err?.message || 'An error occurred while renaming the folder');
      });
  };

  return (
    <StyledWrapper className="flex flex-col h-full overflow-auto">
      <div className="flex flex-col h-full relative px-4 py-4">
        <div className="panel-header">
          <InlineEditableTitle
            value={folder.name}
            onSave={handleRenameFolder}
            validate={(name) => (!name || !name.trim() ? 'Name is required' : null)}
            inputAriaLabel="Edit folder name"
          />
        </div>
        <div className="flex flex-wrap items-center tabs" role="tablist">
          <div className={getTabClassname('headers')} role="tab" onClick={() => setTab('headers')}>
            Headers
            {activeHeadersCount > 0 && <sup className="ml-1 font-medium">{activeHeadersCount}</sup>}
          </div>
          <div className={getTabClassname('script')} role="tab" onClick={() => setTab('script')}>
            Script
            {hasScripts && <StatusDot />}
          </div>
          <div className={getTabClassname('test')} role="tab" onClick={() => setTab('test')}>
            Test
            {hasTests && <StatusDot />}
          </div>
          <div className={getTabClassname('vars')} role="tab" onClick={() => setTab('vars')}>
            Vars
            {activeVarsCount > 0 && <sup className="ml-1 font-medium">{activeVarsCount}</sup>}
          </div>
          <div className={getTabClassname('auth')} role="tab" onClick={() => setTab('auth')}>
            Auth
            {hasAuth && <StatusDot />}
          </div>
          <div className={getTabClassname('docs')} role="tab" onClick={() => setTab('docs')}>
            Docs
          </div>
        </div>
        <section className="panel-content">{getTabPanel(tab)}</section>
      </div>
    </StyledWrapper>
  );
};

export default FolderSettings;
