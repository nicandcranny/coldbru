import React, { useCallback, useMemo } from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { setRequestAssertions } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import AssertionOperator from './AssertionOperator';
import EditableTable from 'components/EditableTable';
import useLocalRows from 'components/EditableTable/useLocalRows';
import StyledWrapper from './StyledWrapper';

const unaryOperators = [
  'isEmpty',
  'isNotEmpty',
  'isNull',
  'isUndefined',
  'isDefined',
  'isTruthy',
  'isFalsy',
  'isJson',
  'isNumber',
  'isString',
  'isBoolean',
  'isArray'
];

const parseAssertionOperator = (str = '') => {
  if (!str || typeof str !== 'string' || !str.length) {
    return { operator: 'eq', value: str };
  }

  const operators = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn',
    'contains', 'notContains', 'length', 'matches', 'notMatches',
    'startsWith', 'endsWith', 'between', ...unaryOperators
  ];

  const [operator, ...rest] = str.split(' ');
  const value = rest.join(' ');

  if (unaryOperators.includes(operator)) {
    return { operator, value: '' };
  }

  if (operators.includes(operator)) {
    return { operator, value };
  }

  return { operator: 'eq', value: str };
};

const isUnaryOperator = (operator) => unaryOperators.includes(operator);

const Assertions = ({ item, collection }) => {
  const dispatch = useDispatch();
  const assertions = item.draft ? get(item, 'draft.request.assertions') : get(item, 'request.assertions');

  const onSave = useCallback(() => dispatch(saveRequest(item.uid, collection.uid)), [dispatch, item.uid, collection.uid]);
  const {
    localRows,
    flushRows,
    updateRow,
    addRow,
    deleteRow,
    reorderRows
  } = useLocalRows({
    rows: assertions || [],
    syncRows: useCallback((updatedAssertions) => {
      dispatch(setRequestAssertions({
        collectionUid: collection.uid,
        itemUid: item.uid,
        assertions: updatedAssertions
      }));
    }, [dispatch, collection.uid, item.uid])
  });
  const handleRun = useCallback(() => {
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.assertions = localRows;
    flushRows(localRows);
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [dispatch, item, collection.uid, localRows, flushRows]);
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
  }, [flushRows, handleRun, onSave]);

  const columns = useMemo(() => [
    {
      key: 'name',
      name: 'Expr',
      isKeyField: true,
      placeholder: 'Expr',
      width: '30%',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushRows(),
      onKeyDown: handleCellKeyDown
    },
    {
      key: 'operator',
      name: 'Operator',
      width: '120px',
      getValue: (row) => parseAssertionOperator(row.value).operator,
      render: ({ row }) => {
        const { operator } = parseAssertionOperator(row.value);
        const assertionValue = parseAssertionOperator(row.value).value;

        const handleOperatorChange = (newOperator) => {
          const newValue = isUnaryOperator(newOperator) ? newOperator : `${newOperator} ${assertionValue}`;
          updateRow(row.uid, { value: newValue });
        };

        return (
          <AssertionOperator
            operator={operator}
            onChange={handleOperatorChange}
          />
        );
      }
    },
    {
      key: 'value',
      name: 'Value',
      width: '30%',
      render: ({ row, value, onChange }) => {
        const { operator, value: assertionValue } = parseAssertionOperator(value);

        if (isUnaryOperator(operator)) {
          return <input type="text" className="cursor-default" disabled />;
        }

        return (
          <input
            type="text"
            className="mousetrap w-full bg-transparent"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={assertionValue}
            onChange={(event) => onChange(`${operator} ${event.target.value.replace(/[\r\n]/g, '')}`)}
            onBlur={() => flushRows()}
            onKeyDown={handleCellKeyDown}
            placeholder={!value ? 'Value' : ''}
          />
        );
      }
    }
  ], [flushRows, handleCellKeyDown, updateRow]);

  const defaultRow = {
    name: '',
    value: 'eq ',
    operator: 'eq'
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
        testId="assertions-table"
      />
    </StyledWrapper>
  );
};

export default Assertions;
