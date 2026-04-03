import React, { useState, useEffect, useRef, useCallback } from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useDispatch, useSelector } from 'react-redux';
import CodeEditor from 'components/CodeEditor';
import { updateRequestTests } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { useTheme } from 'providers/Theme';

const Tests = ({ item, collection }) => {
  const dispatch = useDispatch();
  const tests = item.draft ? get(item, 'draft.request.tests') : get(item, 'request.tests');
  const [localTests, setLocalTests] = useState(tests || '');
  const localTestsRef = useRef(localTests);
  const testsRef = useRef(tests || '');
  const dirtyRef = useRef(false);
  const debouncedSyncRef = useRef(null);

  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);

  useEffect(() => {
    localTestsRef.current = localTests;
  }, [localTests]);

  useEffect(() => {
    testsRef.current = tests || '';
  }, [tests]);

  useEffect(() => {
    if (!dirtyRef.current) {
      setLocalTests(tests || '');
    } else if (isEqual(tests || '', localTestsRef.current)) {
      dirtyRef.current = false;
    }
  }, [tests]);

  const syncTests = useCallback((value) => {
    dispatch(updateRequestTests({
      tests: value,
      itemUid: item.uid,
      collectionUid: collection.uid
    }));
  }, [dispatch, item.uid, collection.uid]);

  useEffect(() => {
    debouncedSyncRef.current = debounce(syncTests, 400);
    return () => {
      debouncedSyncRef.current?.cancel();
    };
  }, [syncTests]);

  const flushTests = useCallback((value = localTestsRef.current) => {
    debouncedSyncRef.current?.cancel();
    if (!isEqual(value, testsRef.current)) {
      syncTests(value);
    } else {
      dirtyRef.current = false;
    }
  }, [syncTests]);

  useEffect(() => {
    return () => {
      flushTests();
    };
  }, [flushTests]);

  const onEdit = useCallback((value) => {
    dirtyRef.current = true;
    setLocalTests(value);
    debouncedSyncRef.current?.(value);
  }, []);

  const onRun = useCallback(() => {
    flushTests();
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.tests = localTestsRef.current;
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushTests, item, dispatch, collection.uid]);

  const onSave = useCallback(() => {
    flushTests();
    dispatch(saveRequest(item.uid, collection.uid));
  }, [flushTests, dispatch, item.uid, collection.uid]);

  return (
    <CodeEditor
      collection={collection}
      value={localTests || ''}
      theme={displayedTheme}
      font={get(preferences, 'font.codeFont', 'default')}
      fontSize={get(preferences, 'font.codeFontSize')}
      onEdit={onEdit}
      mode="javascript"
      onRun={onRun}
      onSave={onSave}
      showHintsFor={['req', 'res', 'bru']}
    />
  );
};

export default Tests;
