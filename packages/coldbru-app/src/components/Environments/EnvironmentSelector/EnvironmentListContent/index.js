import React from 'react';
import { IconPlus, IconDownload, IconSettings, IconSearch, IconX } from '@tabler/icons';
import ToolHint from 'components/ToolHint';
import ColorBadge from 'components/ColorBadge';

const EnvironmentListContent = ({
  environments,
  hasEnvironments,
  activeEnvironmentUid,
  description,
  searchText,
  setSearchText,
  onEnvironmentSelect,
  onSettingsClick,
  onCreateClick,
  onImportClick
}) => {
  return (
    <div>
      {hasEnvironments ? (
        <>
          <div className="environment-search">
            <IconSearch size={13} strokeWidth={1.5} className="environment-search-icon" />
            <input
              type="text"
              placeholder="Search environments..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="environment-search-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {searchText ? (
              <button
                className="environment-search-clear"
                title="Clear search"
                onClick={() => setSearchText('')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <IconX size={12} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
          <div className="environment-list">
            <div className="dropdown-item no-environment" onClick={() => onEnvironmentSelect(null)}>
              <span>No Environment</span>
            </div>
            <ToolHint
              anchorSelect="[data-tooltip-content]"
              place="right"
              positionStrategy="fixed"
              tooltipStyle={{
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}
              delayShow={1000}
            >
              <div>
                {environments.length ? (
                  environments.map((env) => (
                    <div
                      key={env.uid}
                      className={`dropdown-item ${env.uid === activeEnvironmentUid ? 'dropdown-item-active' : ''}`}
                      onClick={() => onEnvironmentSelect(env)}
                      data-tooltip-content={env.name}
                      data-tooltip-hidden={env.name?.length < 90}
                    >
                      <ColorBadge color={env.color} size={8} />
                      <span className="max-w-100% truncate no-wrap">{env.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="environment-no-results">No matching environments</div>
                )}
              </div>
            </ToolHint>
            <div className="dropdown-item configure-button">
              <button onClick={onSettingsClick} id="configure-env">
                <IconSettings size={16} strokeWidth={1.5} />
                <span>Configure</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>Ready to get started?</h3>
          <p>{description}</p>
          <div className="space-y-2">
            <button onClick={onCreateClick} id="create-env">
              <IconPlus size={16} strokeWidth={1.5} />
              Create
            </button>
            <button onClick={onImportClick} id="import-env">
              <IconDownload size={16} strokeWidth={1.5} />
              Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentListContent;
