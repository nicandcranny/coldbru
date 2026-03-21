import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  background: ${(props) => props.theme.sidebar.bg};

  .source-control-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px 10px;
    border-bottom: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
  }

  .source-control-title {
    font-size: ${(props) => props.theme.font.size.md};
    font-weight: 600;
  }

  .source-control-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${(props) => props.theme.sidebar.muted};
    font-size: ${(props) => props.theme.font.size.xs};
  }

  .source-control-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 8px 8px 0;
  }

  .source-control-composer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    border-bottom: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
  }

  .source-control-empty {
    padding: 18px 8px;
    color: ${(props) => props.theme.sidebar.muted};
    text-align: center;
    line-height: 1.5;
  }

  .change-group {
    margin-bottom: 12px;
  }

  .change-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 6px 6px;
    color: ${(props) => props.theme.sidebar.muted};
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .change-group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .change-group-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    color: ${(props) => props.theme.sidebar.color};
    font-size: 11px;
  }

  .change-group-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .change-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .change-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 34px;
    padding: 4px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    color: ${(props) => props.theme.sidebar.color};
    background: transparent;
    text-align: left;
  }

  .change-row:hover {
    background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
  }

  .change-main {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .change-name {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
  }

  .change-filename,
  .change-path {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .change-filename {
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .change-path {
    color: ${(props) => props.theme.sidebar.muted};
    font-size: 11px;
  }

  .change-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 8px;
  }

  .change-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: ${(props) => props.theme.sidebar.muted};
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
  }

  .change-icon-button.visible {
    opacity: 1;
  }

  .change-row:hover .change-icon-button,
  .change-row:focus-within .change-icon-button {
    opacity: 1;
  }

  .change-icon-button:hover {
    background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    color: ${(props) => props.theme.sidebar.color};
  }

  .change-icon-button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .change-status {
    min-width: 12px;
    text-align: center;
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .status-m {
    color: #d19a66;
  }

  .status-u {
    color: #56b6c2;
  }

  .status-a {
    color: #61af5f;
  }

  .status-d {
    color: #e06c75;
  }

  .status-r {
    color: #c678dd;
  }

  .commit-input {
    width: 100%;
    min-height: 84px;
    padding: 10px 12px;
    border: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
    border-radius: 8px;
    resize: vertical;
    background: ${(props) => props.theme.sidebar.bg};
    color: ${(props) => props.theme.sidebar.color};
  }

  .commit-input:focus {
    outline: none;
    border-color: ${(props) => props.theme.sidebar.color};
  }

  .source-control-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .source-control-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
    border-radius: 8px;
    background: transparent;
    color: ${(props) => props.theme.sidebar.color};
    font-size: ${(props) => props.theme.font.size.sm};
    font-weight: 500;
    cursor: pointer;
  }

  .source-control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .is-spinning {
    animation: scm-spin 1s linear infinite;
  }

  @keyframes scm-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export default StyledWrapper;
