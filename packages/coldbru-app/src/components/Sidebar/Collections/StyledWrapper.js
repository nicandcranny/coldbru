import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding-top: 4px;
  padding-bottom: 4px;
  width: 100%;

  .collections-list {
    flex: 1 1 0%;
    min-height: 0;
    min-width: 0;
    padding-top: 4px;
    padding-bottom: 4px;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
  }
`;

export default Wrapper;
