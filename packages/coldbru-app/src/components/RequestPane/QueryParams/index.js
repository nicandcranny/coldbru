import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import InfoTip from 'components/InfoTip';
import { useDispatch } from 'react-redux';
import {
  updatePathParam,
  setQueryParams
} from 'providers/ReduxStore/slices/collections';
import { saveRequest, sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import EditableTable from 'components/EditableTable';
import StyledWrapper from './StyledWrapper';
import BulkEditor from '../../BulkEditor';
import { getAllVariables } from 'utils/collections';
import { buildVariableHints } from 'utils/common/nativeAutocomplete';

const QueryParams = ({ item, collection }) => {
  const dispatch = useDispatch();
  const params = item.draft ? get(item, 'draft.request.params') : get(item, 'request.params');
  const allVariables = useMemo(() => getAllVariables(collection, item), [collection, item]);
  const variableHints = useMemo(() => buildVariableHints(allVariables), [allVariables]);
  const queryParams = params.filter((param) => param.type === 'query');
  const pathParams = params.filter((param) => param.type === 'path');

  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [localQueryParams, setLocalQueryParams] = useState(queryParams);
  const [localPathParams, setLocalPathParams] = useState(pathParams);
  const localQueryParamsRef = useRef(localQueryParams);
  const localPathParamsRef = useRef(localPathParams);
  const debouncedQuerySyncRef = useRef(null);
  const debouncedPathSyncRef = useRef(null);
  const areQueryParamsDirtyRef = useRef(false);
  const arePathParamsDirtyRef = useRef(false);
  const queryParamsRef = useRef(queryParams);
  const pathParamsRef = useRef(pathParams);

  useEffect(() => {
    localQueryParamsRef.current = localQueryParams;
  }, [localQueryParams]);

  useEffect(() => {
    localPathParamsRef.current = localPathParams;
  }, [localPathParams]);

  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  useEffect(() => {
    pathParamsRef.current = pathParams;
  }, [pathParams]);

  useEffect(() => {
    if (isEqual(queryParams, localQueryParams)) {
      areQueryParamsDirtyRef.current = false;
    } else if (!areQueryParamsDirtyRef.current) {
      setLocalQueryParams(queryParams);
    }

    if (isEqual(pathParams, localPathParams)) {
      arePathParamsDirtyRef.current = false;
    } else if (!arePathParamsDirtyRef.current) {
      setLocalPathParams(pathParams);
    }
  }, [item.uid, queryParams, pathParams]);

  const syncQueryParamsToStore = useCallback((updatedParams) => {
    const paramsWithType = updatedParams.map((p) => ({ ...p, type: 'query' }));
    dispatch(setQueryParams({
      collectionUid: collection.uid,
      itemUid: item.uid,
      params: paramsWithType
    }));
  }, [dispatch, collection.uid, item.uid]);

  const syncPathParamsToStore = useCallback((updatedPathParams) => {
    updatedPathParams.forEach((pathParam) => {
      dispatch(updatePathParam({
        pathParam,
        itemUid: item.uid,
        collectionUid: collection.uid
      }));
    });
  }, [dispatch, item.uid, collection.uid]);

  useEffect(() => {
    debouncedQuerySyncRef.current = debounce((updatedParams) => {
      syncQueryParamsToStore(updatedParams);
    }, 400);

    debouncedPathSyncRef.current = debounce((updatedParams) => {
      syncPathParamsToStore(updatedParams);
    }, 400);

    return () => {
      debouncedQuerySyncRef.current?.cancel();
      debouncedPathSyncRef.current?.cancel();
      debouncedQuerySyncRef.current = null;
      debouncedPathSyncRef.current = null;
    };
  }, [syncQueryParamsToStore, syncPathParamsToStore]);

  const flushQuerySync = useCallback((updatedParams = localQueryParamsRef.current) => {
    debouncedQuerySyncRef.current?.cancel();
    if (!isEqual(updatedParams, queryParamsRef.current)) {
      syncQueryParamsToStore(updatedParams);
    } else {
      areQueryParamsDirtyRef.current = false;
    }
  }, [syncQueryParamsToStore]);

  const flushPathSync = useCallback((updatedParams = localPathParamsRef.current) => {
    debouncedPathSyncRef.current?.cancel();
    if (!isEqual(updatedParams, pathParamsRef.current)) {
      syncPathParamsToStore(updatedParams);
    } else {
      arePathParamsDirtyRef.current = false;
    }
  }, [syncPathParamsToStore]);

  useEffect(() => {
    return () => {
      flushQuerySync();
      flushPathSync();
    };
  }, [flushQuerySync, flushPathSync]);

  const onSave = useCallback(() => {
    flushQuerySync();
    flushPathSync();
    dispatch(saveRequest(item.uid, collection.uid));
  }, [flushQuerySync, flushPathSync, dispatch, item.uid, collection.uid]);

  const handleRun = useCallback(() => {
    flushQuerySync();
    flushPathSync();
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.params = [
      ...localQueryParamsRef.current.map((param) => ({ ...param, type: 'query' })),
      ...localPathParamsRef.current.map((param) => ({ ...param, type: 'path' }))
    ];
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushQuerySync, flushPathSync, item, dispatch, collection.uid]);

  const handleQueryParamsChange = useCallback((updatedParams) => {
    areQueryParamsDirtyRef.current = true;
    setLocalQueryParams(updatedParams);
    debouncedQuerySyncRef.current?.(updatedParams);
  }, []);

  const commitLocalQueryParams = useCallback((updater) => {
    setLocalQueryParams((currentQueryParams) => {
      const nextQueryParams = typeof updater === 'function' ? updater(currentQueryParams) : updater;
      areQueryParamsDirtyRef.current = true;
      debouncedQuerySyncRef.current?.(nextQueryParams);
      return nextQueryParams;
    });
  }, []);

  const commitLocalPathParams = useCallback((updater) => {
    setLocalPathParams((currentPathParams) => {
      const nextPathParams = typeof updater === 'function' ? updater(currentPathParams) : updater;
      arePathParamsDirtyRef.current = true;
      debouncedPathSyncRef.current?.(nextPathParams);
      return nextPathParams;
    });
  }, []);

  const updateQueryParamRow = useCallback((rowUid, patch) => {
    commitLocalQueryParams((currentQueryParams) => currentQueryParams.map((queryParam) => {
      if (queryParam.uid !== rowUid) {
        return queryParam;
      }

      const nextQueryParam = { ...queryParam, ...patch };
      return isEqual(nextQueryParam, queryParam) ? queryParam : nextQueryParam;
    }));
  }, [commitLocalQueryParams]);

  const addQueryParamRow = useCallback((row) => {
    commitLocalQueryParams((currentQueryParams) => [...currentQueryParams, row]);
  }, [commitLocalQueryParams]);

  const deleteQueryParamRow = useCallback((rowUid) => {
    commitLocalQueryParams((currentQueryParams) => currentQueryParams.filter((queryParam) => queryParam.uid !== rowUid));
  }, [commitLocalQueryParams]);

  const handlePathParamChange = useCallback((rowUid, key, value) => {
    commitLocalPathParams((currentPathParams) => currentPathParams.map((pathParam) => {
      if (pathParam.uid !== rowUid) {
        return pathParam;
      }

      const nextPathParam = { ...pathParam, [key]: value };
      return isEqual(nextPathParam, pathParam) ? pathParam : nextPathParam;
    }));
  }, [commitLocalPathParams]);

  const reorderQueryParams = useCallback(({ updateReorderedItem }) => {
    commitLocalQueryParams((currentQueryParams) => {
      const queryParamByUid = new Map(currentQueryParams.map((queryParam) => [queryParam.uid, queryParam]));
      return updateReorderedItem.map((uid) => queryParamByUid.get(uid)).filter(Boolean);
    });
  }, [commitLocalQueryParams]);

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

  const queryColumns = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '30%',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushQuerySync(),
      onKeyDown: handleCellKeyDown,
      variableHints,
      variableContext: allVariables
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushQuerySync(),
      onKeyDown: handleCellKeyDown,
      variableHints,
      variableContext: allVariables
    }
  ], [allVariables, flushQuerySync, handleCellKeyDown, variableHints]);

  const pathColumns = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      width: '30%',
      readOnly: true
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      sanitizeValue: (value) => value.replace(/[\r\n]/g, ''),
      onBlurCell: () => flushPathSync(),
      onKeyDown: handleCellKeyDown,
      variableHints,
      variableContext: allVariables
    }
  ], [allVariables, flushPathSync, handleCellKeyDown, variableHints]);

  const defaultQueryRow = {
    name: '',
    value: '',
    description: '',
    type: 'query'
  };

  if (isBulkEditMode) {
    return (
      <StyledWrapper className="w-full mt-3">
        <BulkEditor
          params={localQueryParams}
          onChange={handleQueryParamsChange}
          onToggle={toggleBulkEditMode}
          onSave={onSave}
          onRun={handleRun}
        />
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="w-full flex flex-col">
      <div className="flex-1">
        <div className="mb-3 title text-xs">Query</div>
        <EditableTable
          columns={queryColumns}
          rows={localQueryParams || []}
          defaultRow={defaultQueryRow}
          reorderable={true}
          onReorder={reorderQueryParams}
          rowUpdateMode={true}
          onRowChange={updateQueryParamRow}
          onAddRow={addQueryParamRow}
          onDeleteRow={deleteQueryParamRow}
        />
        <div className="flex justify-end mt-2">
          <button className="btn-action text-link select-none" onClick={toggleBulkEditMode}>
            Bulk Edit
          </button>
        </div>

        <div className="mb-3 title text-xs flex items-stretch">
          <span>Path</span>
          <InfoTip infotipId="path-param-InfoTip">
            <div>
              Path variables are automatically added whenever the
              <code className="font-mono mx-2">:name</code>
              template is used in the URL. <br /> For example:
              <code className="font-mono mx-2">
                https://example.com/v1/users/<span>:id</span>
              </code>
            </div>
          </InfoTip>
        </div>
        {localPathParams && localPathParams.length > 0 ? (
          <EditableTable
            columns={pathColumns}
            rows={localPathParams}
            defaultRow={{}}
            showCheckbox={false}
            showDelete={false}
            showAddRow={false}
            rowUpdateMode={true}
            onRowChange={(rowUid, patch) => {
              if (patch.value !== undefined) {
                handlePathParamChange(rowUid, 'value', patch.value);
              }
            }}
          />
        ) : (
          <div className="title pr-2 py-3 mt-2 text-xs"></div>
        )}
      </div>
    </StyledWrapper>
  );
};

export default QueryParams;
