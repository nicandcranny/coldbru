import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { setRequestHeaders } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import EditableTable from 'components/EditableTable';
import StyledWrapper from './StyledWrapper';
import { headers as StandardHTTPHeaders } from 'know-your-http-well';
import BulkEditor from '../../BulkEditor';
import { headerNameRegex, headerValueRegex } from 'utils/common/regex';

const headerAutoCompleteList = StandardHTTPHeaders.map((e) => e.header);

const RequestHeaders = ({ item, collection, addHeaderText }) => {
  const dispatch = useDispatch();
  const headers = item.draft ? get(item, 'draft.request.headers') : get(item, 'request.headers');
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [localHeaders, setLocalHeaders] = useState(headers || []);
  const localHeadersRef = useRef(localHeaders);
  const debouncedHeadersSyncRef = useRef(null);
  const areHeadersDirtyRef = useRef(false);
  const headersRef = useRef(headers || []);

  useEffect(() => {
    localHeadersRef.current = localHeaders;
  }, [localHeaders]);

  useEffect(() => {
    headersRef.current = headers || [];
  }, [headers]);

  useEffect(() => {
    const nextHeaders = headers || [];
    if (isEqual(nextHeaders, localHeaders)) {
      areHeadersDirtyRef.current = false;
      return;
    }

    if (!areHeadersDirtyRef.current) {
      setLocalHeaders(nextHeaders);
    }
  }, [item.uid, headers]);

  const syncHeadersToStore = useCallback((updatedHeaders) => {
    dispatch(setRequestHeaders({
      collectionUid: collection.uid,
      itemUid: item.uid,
      headers: updatedHeaders
    }));
  }, [dispatch, collection.uid, item.uid]);

  useEffect(() => {
    debouncedHeadersSyncRef.current = debounce((updatedHeaders) => {
      syncHeadersToStore(updatedHeaders);
    }, 400);

    return () => {
      debouncedHeadersSyncRef.current?.cancel();
      debouncedHeadersSyncRef.current = null;
    };
  }, [syncHeadersToStore]);

  const flushHeadersSync = useCallback((updatedHeaders = localHeadersRef.current) => {
    debouncedHeadersSyncRef.current?.cancel();

    if (!isEqual(updatedHeaders, headersRef.current)) {
      syncHeadersToStore(updatedHeaders);
    } else {
      areHeadersDirtyRef.current = false;
    }
  }, [syncHeadersToStore]);

  useEffect(() => {
    return () => {
      flushHeadersSync();
    };
  }, [flushHeadersSync]);

  const onSave = useCallback(() => {
    flushHeadersSync();
    dispatch(saveRequest(item.uid, collection.uid));
  }, [flushHeadersSync, dispatch, item.uid, collection.uid]);

  const handleRun = useCallback(() => {
    flushHeadersSync();
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.headers = localHeadersRef.current;
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushHeadersSync, item, dispatch, collection.uid]);

  const handleHeadersChange = useCallback((updatedHeaders) => {
    areHeadersDirtyRef.current = true;
    setLocalHeaders(updatedHeaders);
    debouncedHeadersSyncRef.current?.(updatedHeaders);
  }, []);

  const commitLocalHeaders = useCallback((updater) => {
    setLocalHeaders((currentHeaders) => {
      const nextHeaders = typeof updater === 'function' ? updater(currentHeaders) : updater;
      areHeadersDirtyRef.current = true;
      debouncedHeadersSyncRef.current?.(nextHeaders);
      return nextHeaders;
    });
  }, []);

  const updateHeaderRow = useCallback((rowUid, patch) => {
    commitLocalHeaders((currentHeaders) => currentHeaders.map((header) => {
      if (header.uid !== rowUid) {
        return header;
      }

      const nextHeader = { ...header, ...patch };
      return isEqual(nextHeader, header) ? header : nextHeader;
    }));
  }, [commitLocalHeaders]);

  const addHeaderRow = useCallback((row) => {
    commitLocalHeaders((currentHeaders) => [...currentHeaders, row]);
  }, [commitLocalHeaders]);

  const deleteHeaderRow = useCallback((rowUid) => {
    commitLocalHeaders((currentHeaders) => currentHeaders.filter((header) => header.uid !== rowUid));
  }, [commitLocalHeaders]);

  const reorderHeaders = useCallback(({ updateReorderedItem }) => {
    commitLocalHeaders((currentHeaders) => {
      const headerByUid = new Map(currentHeaders.map((header) => [header.uid, header]));
      return updateReorderedItem.map((uid) => headerByUid.get(uid)).filter(Boolean);
    });
  }, [commitLocalHeaders]);

  const getRowError = useCallback((row, index, key) => {
    if (key === 'name') {
      if (!row.name || row.name.trim() === '') return null;
      if (!headerNameRegex.test(row.name)) {
        return 'Header name cannot contain spaces or newlines';
      }
    }
    if (key === 'value') {
      if (!row.value) return null;
      if (!headerValueRegex.test(row.value)) {
        return 'Header value cannot contain newlines';
      }
    }
    return null;
  }, []);

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
  };

  const handleCellKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRun();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      onSave();
    }
  }, [handleRun, onSave]);

  const columns = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '30%',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushHeadersSync(),
      onKeyDown: handleCellKeyDown,
      autocompleteOptions: headerAutoCompleteList
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushHeadersSync(),
      onKeyDown: handleCellKeyDown
    }
  ], [flushHeadersSync, handleCellKeyDown]);

  const defaultRow = {
    name: '',
    value: '',
    description: ''
  };

  if (isBulkEditMode) {
    return (
      <StyledWrapper className="w-full mt-3">
        <BulkEditor
          params={localHeaders}
          onChange={handleHeadersChange}
          onToggle={toggleBulkEditMode}
          onSave={onSave}
          onRun={handleRun}
        />
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="w-full">
      <EditableTable
        columns={columns}
        rows={localHeaders || []}
        defaultRow={defaultRow}
        getRowError={getRowError}
        showErrorTooltips={false}
        reorderable={true}
        onReorder={reorderHeaders}
        rowUpdateMode={true}
        onRowChange={updateHeaderRow}
        onAddRow={addHeaderRow}
        onDeleteRow={deleteHeaderRow}
      />
      <div className="flex justify-end mt-2">
        <button className="btn-action text-link select-none" onClick={toggleBulkEditMode}>
          Bulk Edit
        </button>
      </div>
    </StyledWrapper>
  );
};

export default RequestHeaders;
