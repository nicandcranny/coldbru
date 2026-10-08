import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  .history-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 6px;
    gap: 2px;
  }

  .history-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: ${(props) => props.theme.sidebar.color};
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }
  }

  .history-item-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .history-item-url {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-item-meta {
    color: ${(props) => props.theme.sidebar.muted};
    font-size: 11px;
  }

  .history-item-host {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-item-time {
    margin-left: auto;
    flex-shrink: 0;
  }

  .history-empty {
    padding: 12px 10px;
    color: ${(props) => props.theme.sidebar.muted};
    font-size: 12px;
  }
`;

export default StyledWrapper;
