import React, { useCallback, useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import {
  setFormUrlEncodedParams
} from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';

const FormUrlEncodedParams = ({ item, collection }) => {
  const dispatch = useDispatch();
  const params = item.draft ? get(item, 'draft.request.body.formUrlEncoded') : get(item, 'request.body.formUrlEncoded');

  const onSave = useCallback(() => dispatch(saveRequest(item.uid, collection.uid)), [dispatch, item.uid, collection.uid]);
  const {
    localRows,
    flushRows,
    updateRow,
    addRow,
    deleteRow,
    reorderRows
  } = useLocalRows({
    rows: params || [],
    syncRows: useCallback((updatedParams) => {
      dispatch(setFormUrlEncodedParams({
        collectionUid: collection.uid,
        itemUid: item.uid,
        params: updatedParams
      }));
    }, [dispatch, collection.uid, item.uid])
  });
  const handleRun = useCallback(() => {
    flushRows();
    dispatch(sendRequest(item, collection.uid));
  }, [flushRows, dispatch, item, collection.uid]);

  const handleCellKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRun();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      flushRows();
      onSave();
    }
  }, [handleRun, flushRows, onSave]);

  const columns = useMemo(() => [
    {
      key: 'name',
      name: 'Key',
      isKeyField: true,
      placeholder: 'Key',
      width: '30%',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
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

  return (
    <StyledWrapper className="w-full">
      <EditableTable
        columns={columns}
        rows={localRows}
        defaultRow={defaultRow}
        reorderable={true}
        onReorder={reorderRows}
        rowUpdateMode={true}
        onRowChange={updateRow}
        onAddRow={addRow}
        onDeleteRow={deleteRow}
      />
    </StyledWrapper>
  );
};

export default FormUrlEncodedParams;
