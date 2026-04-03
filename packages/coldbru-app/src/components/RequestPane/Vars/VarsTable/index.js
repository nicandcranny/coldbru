import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setRequestVars } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import InfoTip from 'components/InfoTip';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';
import { variableNameRegex } from 'utils/common/regex';

const VarsTable = ({ item, collection, vars, varType }) => {
  const dispatch = useDispatch();
  const onSave = useCallback(() => dispatch(saveRequest(item.uid, collection.uid)), [dispatch, item.uid, collection.uid]);
  const {
    localRows,
    flushRows,
    updateRow,
    addRow,
    deleteRow,
    reorderRows
  } = useLocalRows({
    rows: vars || [],
    syncRows: useCallback((updatedVars) => {
      dispatch(setRequestVars({
        collectionUid: collection.uid,
        itemUid: item.uid,
        vars: updatedVars,
        type: varType
      }));
    }, [dispatch, collection.uid, item.uid, varType])
  });
  const handleRun = useCallback(() => {
    flushRows();
    dispatch(sendRequest(item, collection.uid));
  }, [flushRows, dispatch, item, collection.uid]);

  const getRowError = useCallback((row, index, key) => {
    if (key !== 'name') return null;
    if (!row.name || row.name.trim() === '') return null;
    if (!variableNameRegex.test(row.name)) {
      return 'Variable contains invalid characters. Must only contain alphanumeric characters, "-", "_", "."';
    }
    return null;
  }, []);

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
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '35%',
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    },
    {
      key: 'value',
      name: varType === 'request' ? 'Value' : (
        <div className="flex items-center">
          <span>Expr</span>
          <InfoTip content="You can write any valid JS expression here" infotipId={`request-${varType}-var`} />
        </div>
      ),
      placeholder: varType === 'request' ? 'Value' : 'Expr',
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    }
  ], [varType, flushRows, handleCellKeyDown]);

  const defaultRow = {
    name: '',
    value: '',
    ...(varType === 'response' ? { local: false } : {})
  };

  return (
    <StyledWrapper className="w-full">
      <EditableTable
        columns={columns}
        rows={localRows}
        defaultRow={defaultRow}
        getRowError={getRowError}
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

export default VarsTable;
