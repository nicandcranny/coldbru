import { useState, useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

const useLocalRows = ({ rows = [], syncRows, debounceMs = 400 }) => {
  const [localRows, setLocalRows] = useState(rows);
  const localRowsRef = useRef(localRows);
  const sourceRowsRef = useRef(rows);
  const dirtyRef = useRef(false);
  const debouncedSyncRef = useRef(null);

  useEffect(() => {
    localRowsRef.current = localRows;
  }, [localRows]);

  useEffect(() => {
    sourceRowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (isEqual(rows, localRowsRef.current)) {
      dirtyRef.current = false;
      return;
    }

    if (!dirtyRef.current) {
      setLocalRows(rows);
    }
  }, [rows]);

  useEffect(() => {
    debouncedSyncRef.current = debounce((updatedRows) => {
      syncRows(updatedRows);
    }, debounceMs);

    return () => {
      debouncedSyncRef.current?.cancel();
      debouncedSyncRef.current = null;
    };
  }, [syncRows, debounceMs]);

  const flushRows = useCallback((updatedRows = localRowsRef.current) => {
    debouncedSyncRef.current?.cancel();

    if (!isEqual(updatedRows, sourceRowsRef.current)) {
      syncRows(updatedRows);
    } else {
      dirtyRef.current = false;
    }
  }, [syncRows]);

  useEffect(() => {
    return () => {
      flushRows();
    };
  }, [flushRows]);

  const commitRows = useCallback((updater) => {
    setLocalRows((currentRows) => {
      const nextRows = typeof updater === 'function' ? updater(currentRows) : updater;
      dirtyRef.current = true;
      debouncedSyncRef.current?.(nextRows);
      return nextRows;
    });
  }, []);

  const updateRow = useCallback((rowUid, patch) => {
    commitRows((currentRows) => currentRows.map((row) => {
      if (row.uid !== rowUid) {
        return row;
      }

      const nextRow = { ...row, ...patch };
      return isEqual(nextRow, row) ? row : nextRow;
    }));
  }, [commitRows]);

  const addRow = useCallback((row) => {
    commitRows((currentRows) => [...currentRows, row]);
  }, [commitRows]);

  const deleteRow = useCallback((rowUid) => {
    commitRows((currentRows) => currentRows.filter((row) => row.uid !== rowUid));
  }, [commitRows]);

  const reorderRows = useCallback(({ updateReorderedItem }) => {
    commitRows((currentRows) => {
      const rowByUid = new Map(currentRows.map((row) => [row.uid, row]));
      return updateReorderedItem.map((uid) => rowByUid.get(uid)).filter(Boolean);
    });
  }, [commitRows]);

  return {
    localRows,
    flushRows,
    commitRows,
    updateRow,
    addRow,
    deleteRow,
    reorderRows
  };
};

export default useLocalRows;
