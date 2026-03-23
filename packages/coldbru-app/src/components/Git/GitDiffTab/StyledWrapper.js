import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .git-diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-bottom: 1px solid ${(props) => props.theme.statusBar.border};
  }

  .git-diff-title {
    font-size: ${(props) => props.theme.font.size.md};
    font-weight: 600;
  }

  .git-diff-meta {
    color: ${(props) => props.theme.sidebar.muted};
    font-size: ${(props) => props.theme.font.size.sm};
  }

  .git-diff-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    padding: 12px 16px 18px;
  }

  .git-diff-empty {
    color: ${(props) => props.theme.sidebar.muted};
    padding: 16px 0;
  }

  .git-diff-grid {
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.sm};
    overflow: hidden;
    background: ${(props) => props.theme.bg};
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }

  .diff-block-header {
    padding: 6px 12px;
    color: ${(props) => props.theme.sidebar.muted};
    background: ${(props) => props.theme.sidebar.bg};
    border-bottom: 1px solid ${(props) => props.theme.border.border1};
  }

  .diff-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .diff-pane {
    display: grid;
    grid-template-columns: 3.25em minmax(0, 1fr);
    min-width: 0;
  }

  .diff-pane.left {
    border-right: 1px solid ${(props) => props.theme.border.border1};
  }

  .diff-pane.delete {
    background: color-mix(in srgb, ${(props) => props.theme.colors.text.danger} 15%, transparent);
  }

  .diff-pane.insert {
    background: color-mix(in srgb, ${(props) => props.theme.colors.text.green} 15%, transparent);
  }

  .diff-pane.empty {
    background: color-mix(in srgb, ${(props) => props.theme.sidebar.bg} 55%, transparent);
  }

  .diff-line-number {
    padding: 0 8px 0 6px;
    color: ${(props) => props.theme.sidebar.muted};
    text-align: right;
    user-select: none;
    border-right: 1px solid color-mix(in srgb, ${(props) => props.theme.border.border1} 70%, transparent);
  }

  .diff-line-content {
    min-width: 0;
    padding: 0 10px;
    white-space: pre;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .diff-line-prefix {
    display: inline-block;
    width: 1ch;
    margin-right: 0.35em;
    color: transparent;
    user-select: none;
  }

  .diff-line-prefix.visible {
    color: ${(props) => props.theme.text};
  }

  .diff-line-text {
    color: ${(props) => props.theme.text};
  }
`;

export default StyledWrapper;
