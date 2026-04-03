import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import InfoTip from 'components/InfoTip';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';
import { variableNameRegex } from 'utils/common/regex';
import { setCollectionVars } from 'providers/ReduxStore/slices/collections/index';
import { getAllVariables } from 'utils/collections';
import { buildVariableHints } from 'utils/common/nativeAutocomplete';

const VarsTable = ({ collection, vars, varType }) => {
  const dispatch = useDispatch();
  const variableHints = useMemo(() => buildVariableHints(getAllVariables(collection)), [collection]);
  const onSave = useCallback(() => dispatch(saveCollectionSettings(collection.uid)), [dispatch, collection.uid]);

  const handleVarsChange = useCallback((updatedVars) => {
    dispatch(setCollectionVars({ collectionUid: collection.uid, vars: updatedVars, type: varType }));
  }, [dispatch, collection.uid, varType]);
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
          <InfoTip content="You can write any valid JS Template Literal here" infotipId={`collection-${varType}-var`} />
        </div>
      ),
      placeholder: varType === 'request' ? 'Value' : 'Expr',
      variableHints,
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    }
  ], [varType, flushRows, handleCellKeyDown, variableHints]);

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
