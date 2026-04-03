import React, { useState, useCallback, useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { setCollectionHeaders } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';
import { headers as StandardHTTPHeaders } from 'know-your-http-well';
import BulkEditor from 'components/BulkEditor/index';
import Button from 'ui/Button';
import { headerNameRegex, headerValueRegex } from 'utils/common/regex';

const headerAutoCompleteList = StandardHTTPHeaders.map((e) => e.header);

const Headers = ({ collection }) => {
  const dispatch = useDispatch();
  const headers = collection.draft?.root
    ? get(collection, 'draft.root.request.headers', [])
    : get(collection, 'root.request.headers', []);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
  };

  const handleHeadersChange = useCallback((updatedHeaders) => {
    dispatch(setCollectionHeaders({ collectionUid: collection.uid, headers: updatedHeaders }));
  }, [dispatch, collection.uid]);
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
    dispatch(saveCollectionSettings(collection.uid));
  }, [flushRows, dispatch, collection.uid]);

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
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    }
  ], [flushRows, handleCellKeyDown]);

  const defaultRow = {
    name: '',
    value: '',
    description: ''
  };

  if (isBulkEditMode) {
    return (
      <StyledWrapper className="h-full w-full">
        <div className="text-xs mb-4 text-muted">
          Add request headers that will be sent with every request in this collection.
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
    <StyledWrapper className="h-full w-full">
      <div className="text-xs mb-4 text-muted">
        Add request headers that will be sent with every request in this collection.
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
