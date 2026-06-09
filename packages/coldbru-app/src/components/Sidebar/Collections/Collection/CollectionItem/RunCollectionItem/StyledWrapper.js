import styled from 'styled-components';

const Wrapper = styled.div`
  .bruno-modal-content {
    padding-bottom: 1rem;
  }

  .warning {
    color: ${(props) => props.theme.colors.text.danger};
  }

  .text-muted {
    color: ${(props) => props.theme.colors.text.muted};
  }

  .runner-csv-panel {
    padding: 0.875rem;
    border: 1px solid ${(props) => props.theme.border.border0};
    border-radius: 4px;
    background: ${(props) => props.theme.background.surface0};
  }

  .runner-csv-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .runner-csv-summary {
    padding-top: 0.875rem;
    border-top: 1px solid ${(props) => props.theme.border.border0};
  }

  .csv-preview-table-wrap {
    max-height: 60vh;
    overflow: auto;
    border: 1px solid ${(props) => props.theme.border.border0};
    border-radius: 4px;
  }

  .csv-preview-table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid ${(props) => props.theme.border.border0};
      text-align: left;
      vertical-align: top;
      white-space: pre-wrap;
      min-width: 120px;
    }

    th {
      position: sticky;
      top: 0;
      background: ${(props) => props.theme.background.surface1};
    }

    .header-row {
      background: ${(props) => props.theme.background.surface0};
      font-weight: 500;
    }
  }
`;

export default Wrapper;
