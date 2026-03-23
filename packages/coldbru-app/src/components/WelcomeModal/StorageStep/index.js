import React, { useEffect, useRef } from 'react';
import StyledWrapper from './StyledWrapper';

const StorageStep = ({
  workspaceName,
  workspaceLocation,
  workspaceNameError,
  workspaceLocationError,
  onWorkspaceNameChange,
  onWorkspaceLocationChange,
  onBrowse,
  isWorkspaceCreated,
  workspaceFolderName
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <StyledWrapper className="step-body">
      <div className="step-label">Workspace</div>
      <div className="step-title">Create your first workspace</div>
      <div className="step-description">
        Workspaces keep your collections, environments, and API specs organized in one place on your filesystem.
      </div>

      <div className="workspace-form-field">
        <label htmlFor="welcome-workspace-name" className="workspace-form-label">
          Workspace Title
        </label>
        <input
          id="welcome-workspace-name"
          ref={inputRef}
          type="text"
          className="workspace-form-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={workspaceName}
          onChange={(e) => onWorkspaceNameChange(e.target.value)}
          disabled={isWorkspaceCreated}
        />
        {workspaceNameError ? <div className="workspace-form-error">{workspaceNameError}</div> : null}
      </div>

      <div className="workspace-form-field">
        <label htmlFor="welcome-workspace-location" className="workspace-form-label">
          Parent Folder Location
        </label>
        <div className="location-input-group">
          <input
            id="welcome-workspace-location"
            type="text"
            className="workspace-form-input location-input"
            value={workspaceLocation || ''}
            onChange={(e) => onWorkspaceLocationChange(e.target.value)}
            disabled={isWorkspaceCreated}
          />
          <button type="button" className="browse-button" onClick={onBrowse} disabled={isWorkspaceCreated}>
            Browse
          </button>
        </div>
        {workspaceLocationError ? <div className="workspace-form-error">{workspaceLocationError}</div> : null}
        <div className="location-hint">
          ColdBru will create the workspace folder inside this location.
          {workspaceFolderName ? ` Folder name: ${workspaceFolderName}` : ''}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default StorageStep;
