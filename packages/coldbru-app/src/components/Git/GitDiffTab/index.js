import React, { useEffect, useMemo, useState } from 'react';
import StyledWrapper from './StyledWrapper';

const getDisplayPath = (tab) => {
  if (tab.changeType === 'renamed' && tab.from && tab.to) {
    return `${tab.from} -> ${tab.to}`;
  }

  return tab.filePath;
};

const toDiffLine = (line, side) => {
  if (!line) {
    return null;
  }

  const prefix = line.type === 'delete' ? '-' : line.type === 'insert' ? '+' : ' ';

  return {
    number: side === 'left' ? line.oldNumber : line.newNumber,
    type: line.type,
    prefix,
    content: line.content.slice(1)
  };
};

const buildRows = (files) => {
  if (!Array.isArray(files)) {
    return [];
  }

  return files.flatMap((file, fileIndex) => {
    const blocks = Array.isArray(file.blocks) ? file.blocks : [];

    return blocks.flatMap((block, blockIndex) => {
      const rows = [
        {
          id: `file-${fileIndex}-block-${blockIndex}-header`,
          kind: 'header',
          header: block.header
        }
      ];

      const lines = Array.isArray(block.lines) ? block.lines : [];

      for (let index = 0; index < lines.length;) {
        const currentLine = lines[index];

        if (currentLine.type === 'context') {
          rows.push({
            id: `file-${fileIndex}-block-${blockIndex}-line-${index}`,
            kind: 'line',
            left: toDiffLine(currentLine, 'left'),
            right: toDiffLine(currentLine, 'right')
          });
          index += 1;
          continue;
        }

        const deleted = [];
        const inserted = [];

        while (index < lines.length && lines[index].type === 'delete') {
          deleted.push(lines[index]);
          index += 1;
        }

        while (index < lines.length && lines[index].type === 'insert') {
          inserted.push(lines[index]);
          index += 1;
        }

        const pairCount = Math.max(deleted.length, inserted.length);
        for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
          rows.push({
            id: `file-${fileIndex}-block-${blockIndex}-change-${index}-${pairIndex}`,
            kind: 'line',
            left: toDiffLine(deleted[pairIndex], 'left'),
            right: toDiffLine(inserted[pairIndex], 'right')
          });
        }
      }

      return rows;
    });
  });
};

const DiffPane = ({ line, side }) => {
  const sideClass = side === 'left' ? 'left' : 'right';
  const stateClass = line?.type || 'empty';

  return (
    <div className={`diff-pane ${sideClass} ${stateClass}`}>
      <div className="diff-line-number">{line?.number ?? ''}</div>
      <div className="diff-line-content">
        <span className={`diff-line-prefix ${line?.prefix?.trim() ? 'visible' : ''}`}>{line?.prefix || ' '}</span>
        <span className="diff-line-text">{line?.content || ''}</span>
      </div>
    </div>
  );
};

const GitDiffTab = ({ collection, tab }) => {
  const [diffData, setDiffData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDiff = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await window.ipcRenderer.invoke('renderer:get-working-git-file-diff', {
          collectionPath: tab.gitScopePath || collection.pathname,
          filePath: tab.filePath,
          changeType: tab.changeType,
          from: tab.from,
          to: tab.to
        });

        if (!cancelled) {
          setDiffData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load diff');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDiff();

    return () => {
      cancelled = true;
    };
  }, [collection.pathname, tab.changeType, tab.filePath, tab.from, tab.gitScopePath, tab.to]);

  const hasDiff = Boolean(diffData?.unifiedDiff?.trim());
  const parsedDiff = useMemo(() => {
    if (!hasDiff || !window.Diff2Html) {
      return [];
    }

    try {
      return window.Diff2Html.parse(diffData.unifiedDiff);
    } catch (err) {
      return [];
    }
  }, [diffData?.unifiedDiff, hasDiff]);

  const rows = useMemo(() => buildRows(parsedDiff), [parsedDiff]);

  return (
    <StyledWrapper>
      <div className="git-diff-header">
        <div>
          <div className="git-diff-title">{tab.tabName || 'Diff'}</div>
          <div className="git-diff-meta">{getDisplayPath(tab)}</div>
        </div>
      </div>

      <div className="git-diff-body">
        {loading ? <div className="git-diff-empty">Loading diff...</div> : null}
        {!loading && error ? <div className="git-diff-empty">{error}</div> : null}
        {!loading && !error && !hasDiff ? <div className="git-diff-empty">No diff available for this file.</div> : null}
        {!loading && !error && hasDiff ? (
          <div className="git-diff-grid">
            {rows.map((row) =>
              row.kind === 'header' ? (
                <div key={row.id} className="diff-block-header">
                  {row.header}
                </div>
              ) : (
                <div key={row.id} className="diff-row">
                  <DiffPane line={row.left} side="left" />
                  <DiffPane line={row.right} side="right" />
                </div>
              )
            )}
          </div>
        ) : null}
      </div>
    </StyledWrapper>
  );
};

export default GitDiffTab;
