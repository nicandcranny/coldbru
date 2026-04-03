import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useDispatch } from 'react-redux';
import { setAuthContent } from 'providers/ReduxStore/slices/collections';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';

const useLocalAuthMode = ({
  mode,
  item,
  collection,
  request,
  save,
  defaultContent = {}
}) => {
  const dispatch = useDispatch();
  const authContent = useMemo(() => ({
    ...defaultContent,
    ...(get(request, `auth.${mode}`, {}) || {})
  }), [defaultContent, mode, request]);
  const [localAuth, setLocalAuth] = useState(authContent);
  const dirtyRef = useRef(false);
  const debouncedSyncRef = useRef(null);

  const syncAuthToStore = useCallback((content) => {
    dispatch(setAuthContent({
      mode,
      collectionUid: collection.uid,
      itemUid: item.uid,
      content
    }));
  }, [dispatch, mode, collection.uid, item.uid]);

  useEffect(() => {
    if (isEqual(authContent, localAuth)) {
      dirtyRef.current = false;
      return;
    }

    if (!dirtyRef.current) {
      setLocalAuth(authContent);
    }
  }, [authContent, localAuth]);

  useEffect(() => {
    debouncedSyncRef.current = debounce((content) => {
      syncAuthToStore(content);
    }, 400);

    return () => {
      debouncedSyncRef.current?.cancel();
      debouncedSyncRef.current = null;
    };
  }, [syncAuthToStore]);

  const flushLocalAuth = useCallback((content = localAuth) => {
    debouncedSyncRef.current?.cancel();

    if (!isEqual(content, authContent)) {
      syncAuthToStore(content);
      return;
    }

    dirtyRef.current = false;
  }, [authContent, localAuth, syncAuthToStore]);

  useEffect(() => {
    return () => {
      flushLocalAuth();
    };
  }, [flushLocalAuth]);

  const updateLocalField = useCallback((key, value) => {
    setLocalAuth((currentAuth) => {
      const nextAuth = { ...currentAuth, [key]: value };
      dirtyRef.current = true;
      debouncedSyncRef.current?.(nextAuth);
      return nextAuth;
    });
  }, []);

  const handleSave = useCallback(() => {
    flushLocalAuth();
    save();
  }, [flushLocalAuth, save]);

  const handleRun = useCallback(() => {
    flushLocalAuth();

    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.auth = {
      ...(requestRoot.auth || {}),
      mode,
      [mode]: localAuth
    };

    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushLocalAuth, item, mode, localAuth, dispatch, collection.uid]);

  const handleInputKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRun();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      handleSave();
    }
  }, [handleRun, handleSave]);

  return {
    localAuth,
    updateLocalField,
    handleSave,
    handleRun,
    handleInputKeyDown,
    flushLocalAuth
  };
};

export default useLocalAuthMode;
