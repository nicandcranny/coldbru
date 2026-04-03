import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { saveFolderRoot } from 'providers/ReduxStore/slices/collections/actions';
import InfoTip from 'components/InfoTip';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';
import { variableNameRegex } from 'utils/common/regex';
import { setFolderVars } from 'providers/ReduxStore/slices/collections/index';

const VarsTable = ({ folder, collection, vars, varType }) => {
  const dispatch = useDispatch();
  const onSave = useCallback(() => dispatch(saveFolderRoot(collection.uid, folder.uid)), [dispatch, collection.uid, folder.uid]);

  const handleVarsChange = useCallback((updatedVars) => {
    dispatch(setFolderVars({
      collectionUid: collection.uid,
      folderUid: folder.uid,
      vars: updatedVars,
      type: varType
    }));
  }, [dispatch, collection.uid, folder.uid, varType]);
  const {
    localRows,
    flushRows,
    updateRow,
    addRow,
    deleteRow
  } = useLocalRows({ rows: vars, syncRows: handleVarsChange });

  const getRowError = useCallback((row, index, key) => {
    if (key !== 'name') return null;
    if (!row.name || row.name.trim() === '') return null;
    if (!variableNameRegex.test(row.name)) {
      return 'Variable contains invalid characters. Must only contain alphanumeric characters, "-", "_", "."';
    }
    return null;
  }, []);

  const handleCellKeyDown = useCallback((event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      flushRows();
      onSave();
    }
  }, [flushRows, onSave]);

  const columns = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '40%'
    },
    {
      key: 'value',
      name: varType === 'request' ? 'Value' : (
        <div className="flex items-center">
          <span>Expr</span>
          <InfoTip content="You can write any valid JS expression here" infotipId={`folder-${varType}-var`} />
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
        rowUpdateMode={true}
        onRowChange={updateRow}
        onAddRow={addRow}
        onDeleteRow={deleteRow}
      />
    </StyledWrapper>
  );
};

export default VarsTable;
