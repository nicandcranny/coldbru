import styled from 'styled-components';

const Wrapper = styled.div`
  max-width: 800px;

  .native-auth-input-wrapper {
    min-height: 30px;
    max-width: 400px;
  }

  .native-auth-input {
    width: 100%;
    background: transparent;
    color: ${(props) => props.theme.text};
    border: solid 1px ${(props) => props.theme.input.border};
    border-radius: 3px;
    padding: 6px 8px;
    outline: none;
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
