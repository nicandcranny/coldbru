import styled from 'styled-components';

const Wrapper = styled.div`
  color: ${(props) => props.theme.sidebar.color};
  max-height: 100%;
  min-width: 0;

  aside {
    background-color: ${(props) => props.theme.sidebar.bg};
    overflow: hidden;

    .sidebar-sections-container {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-sections {
      min-height: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    .sidebar-activity-layout {
      display: flex;
      min-height: 0;
      min-width: 0;
      height: 100%;
      width: 100%;
    }

    .sidebar-activity-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 52px;
      padding: 8px 8px;
      border-right: 1px solid ${(props) => props.theme.sidebar.collection.item.hoverBg};
      flex-shrink: 0;
    }

    .sidebar-activity-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 6px;
      color: ${(props) => props.theme.sidebar.muted};
      background: transparent;
      transition: background-color 0.15s ease, color 0.15s ease;
      cursor: pointer;

      &:hover {
        color: ${(props) => props.theme.sidebar.color};
        background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      }

      &.active {
        color: ${(props) => props.theme.sidebar.color};
        background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      }

      &.active::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        border-radius: 999px;
        background: ${(props) => props.theme.sidebar.color};
      }
    }

    .sidebar-panel {
      display: flex;
      flex: 1 1 0%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      width: 100%;
    }
  }

  div.sidebar-drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    cursor: col-resize;
    background-color: transparent;
    width: 6px;
    right: -3px;
    transition: opacity 0.2s ease;

    div.drag-request-border {
      width: 1px;
      height: 100%;
      border-left: solid 1px ${(props) => props.theme.sidebar.dragbar.border};
    }

    &:hover div.drag-request-border {
      width: 1px;
      height: 100%;
      border-left: solid 1px ${(props) => props.theme.sidebar.dragbar.activeBorder};
    }
  }
`;

export default Wrapper;
