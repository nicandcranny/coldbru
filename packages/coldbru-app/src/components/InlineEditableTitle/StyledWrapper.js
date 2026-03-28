import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  .title-shell {
    min-width: 0;
  }

  .title-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }

  .title-surface {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: text;
    transition: background 0.15s ease;

    &:hover,
    &:focus-visible {
      background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
      outline: none;
    }
  }

  .title-text {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${(props) => props.theme.font.size.base};
    font-weight: 500;
    color: ${(props) => props.theme.text};
  }

  .title-after {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .title-input {
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    border: none;
    border-radius: 6px;
    outline: none;
    background: ${(props) => props.theme.sidebar.collection.item.hoverBg};
    color: ${(props) => props.theme.text};
    font-size: ${(props) => props.theme.font.size.base};
    font-weight: 500;
  }

  .title-error {
    font-size: 11px;
    color: ${(props) => props.theme.colors.text.danger};
  }
`;

export default StyledWrapper;
