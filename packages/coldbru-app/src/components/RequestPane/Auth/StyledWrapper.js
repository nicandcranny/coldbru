import styled from 'styled-components';

const Wrapper = styled.div`
  .inherit-mode-text {
    color: ${(props) => props.theme.primary.text};
  }
  .inherit-mode-label {
  }

  .native-auth-input-wrapper {
    min-height: 30px;
  }

  .native-auth-input {
    width: 100%;
    background: transparent;
    color: ${(props) => props.theme.text};
    border: solid 1px ${(props) => props.theme.border.border0};
    border-radius: ${(props) => props.theme.border.radius.base};
    padding: 6px 8px;
    outline: none;

    &:focus {
      border-color: ${(props) => props.theme.colors.accent};
    }
  }

  .native-auth-visibility-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
    background: transparent;
    border: none;
    cursor: pointer;
  }
`;

export default Wrapper;
