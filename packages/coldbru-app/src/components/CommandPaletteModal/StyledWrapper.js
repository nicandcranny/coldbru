import styled from 'styled-components';

const StyledWrapper = styled.div`
  .command-palette-overlay {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 4rem 1rem 1rem;
    background: rgba(0, 0, 0, ${(props) => props.theme.modal.backdrop.opacity});
  }

  .command-palette-modal {
    width: min(38rem, 100%);
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background: ${(props) => props.theme.modal.body.bg};
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: 0.75rem;
    box-shadow: ${(props) => props.theme.shadow.lg};
    overflow: hidden;
  }

  .command-palette-header {
    padding: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .command-palette-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: ${(props) => props.theme.text};

    h1 {
      margin: 0;
      font-size: ${(props) => props.theme.font.size.base};
    }
  }

  .command-palette-search {
    position: relative;

    .search-icon {
      position: absolute;
      top: 50%;
      left: 0.75rem;
      transform: translateY(-50%);
      color: ${(props) => props.theme.colors.text.muted};
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 0.65rem 0.75rem 0.65rem 2.25rem;
      background: transparent;
      border: 1px solid ${(props) => props.theme.input.border};
      border-radius: ${(props) => props.theme.border.radius.base};
      color: ${(props) => props.theme.text};
      font-size: ${(props) => props.theme.font.size.base};

      &:focus {
        outline: none;
        border-color: ${(props) => props.theme.input.focusBorder};
      }
    }
  }

  .command-palette-results {
    overflow-y: auto;
    padding: 0.5rem;
  }

  .command-item {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: ${(props) => props.theme.border.radius.base};
    color: ${(props) => props.theme.text};
    cursor: pointer;

    &:hover,
    &.selected {
      background: ${(props) => props.theme.dropdown.hoverBg};
    }
  }

  .command-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
  }

  .command-item-copy {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .command-item-title {
    font-size: ${(props) => props.theme.font.size.base};
  }

  .command-item-description {
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .command-palette-empty {
    padding: 1rem;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }
`;

export default StyledWrapper;
