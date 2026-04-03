import React, { useState, useCallback, useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { setFolderHeaders } from 'providers/ReduxStore/slices/collections';
import { saveFolderRoot } from 'providers/ReduxStore/slices/collections/actions';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';
import { headers as StandardHTTPHeaders } from 'know-your-http-well';
import BulkEditor from 'components/BulkEditor/index';
import Button from 'ui/Button';
import { headerNameRegex, headerValueRegex } from 'utils/common/regex';
import { getAllVariables } from 'utils/collections';
import { buildVariableHints } from 'utils/common/nativeAutocomplete';

const headerAutoCompleteList = StandardHTTPHeaders.map((e) => e.header);

const Headers = ({ collection, folder }) => {
  const dispatch = useDispatch();
  const headers = folder.draft
    ? get(folder, 'draft.request.headers', [])
    : get(folder, 'root.request.headers', []);
  const allVariables = useMemo(() => getAllVariables(collection, folder), [collection, folder]);
  const variableHints = useMemo(() => buildVariableHints(allVariables), [allVariables]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
  };

  const handleHeadersChange = useCallback((updatedHeaders) => {
    dispatch(setFolderHeaders({
      collectionUid: collection.uid,
      folderUid: folder.uid,
      headers: updatedHeaders
    }));
  }, [dispatch, collection.uid, folder.uid]);
  const {
    localRows: localHeaders,
    flushRows,
    updateRow,
    addRow,
    deleteRow,
    reorderRows
  } = useLocalRows({ rows: headers, syncRows: handleHeadersChange });

  const handleSave = useCallback(() => {
    flushRows();
    dispatch(saveFolderRoot(collection.uid, folder.uid));
  }, [flushRows, dispatch, collection.uid, folder.uid]);

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

  const handleCellKeyDown = useCallback((event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  const columns = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '30%',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      autocompleteOptions: headerAutoCompleteList,
      variableHints,
      variableContext: allVariables,
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      variableHints,
      variableContext: allVariables,
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    }
  ], [allVariables, flushRows, handleCellKeyDown, variableHints]);

  const defaultRow = {
    name: '',
    value: '',
    description: ''
  };

  if (isBulkEditMode) {
    return (
      <StyledWrapper className="w-full">
        <div className="text-xs mb-4 text-muted">
          Request headers that will be sent with every request inside this folder.
        </div>
        <BulkEditor
          params={headers}
          onChange={handleHeadersChange}
          onToggle={toggleBulkEditMode}
          onSave={handleSave}
        />
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="w-full">
      <div className="text-xs mb-4 text-muted">
        Request headers that will be sent with every request inside this folder.
      </div>
      <EditableTable
        columns={columns}
        rows={localHeaders}
        defaultRow={defaultRow}
        getRowError={getRowError}
        rowUpdateMode={true}
        onRowChange={updateRow}
        onAddRow={addRow}
        onDeleteRow={deleteRow}
        onReorder={reorderRows}
        reorderable={true}
      />
      <div className="flex justify-end mt-2">
        <button className="text-link select-none" onClick={toggleBulkEditMode}>
          Bulk Edit
        </button>
      </div>
      <div className="mt-6">
        <Button type="submit" size="sm" onClick={handleSave}>
          Save
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default Headers;
