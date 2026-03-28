import styled from 'styled-components';

const StyledWrapper = styled.div`
  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px 8px 20px;
  }

  .panel-title {
    min-width: 0;
    flex: 1;
  }

  .panel-path {
    margin-top: 2px;
    padding: 0 8px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.text.muted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-icon {
    cursor: pointer;
    color: ${(props) => props.theme.sidebar.dropdownIcon.color};
    padding-right: 8px;
  }

  div.dropdown-item.menu-item {
    color: ${(props) => props.theme.colors.text.danger};
    &:hover {
      background-color: ${(props) => props.theme.colors.bg.danger};
      color: white;
    }
  }

  .react-tooltip {
    z-index: 10;
  }
`;

export default StyledWrapper;
