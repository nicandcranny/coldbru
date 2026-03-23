import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;

  .global-variables-search {
    padding: 8px;
    border-bottom: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
  }

  .global-variables-search-input {
    width: 100%;
  }

  .global-variables-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 6px;
    gap: 2px;
  }

  .global-variable-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 30px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: ${(props) => props.theme.sidebar.color};
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    }

    &.active {
      background: ${(props) => props.theme.sidebar.collection.item.bg};
    }

    &:hover .global-variable-check {
      opacity: 1;
    }
  }

  .global-variable-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .global-variable-actions {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }

  .global-variable-check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: ${(props) => props.theme.sidebar.muted};
    cursor: pointer;
    opacity: 0;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      color: ${(props) => props.theme.sidebar.color};
    }

    &.active {
      color: ${(props) => props.theme.sidebar.color};
      cursor: default;
      opacity: 1;
    }
  }

  .global-variables-empty {
    padding: 12px 10px;
    color: ${(props) => props.theme.sidebar.muted};
    font-size: 12px;
  }
`;

export default StyledWrapper;
