import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';

const useLocalAuthMode = ({
  mode,
  request,
  save,
  syncContent,
  onRunWithContent,
  defaultContent = {}
}) => {
  const authContent = useMemo(() => ({
    ...defaultContent,
    ...(get(request, `auth.${mode}`, {}) || {})
  }), [defaultContent, mode, request]);
  const [localAuth, setLocalAuth] = useState(authContent);
  const localAuthRef = useRef(authContent);
  const authContentRef = useRef(authContent);
  const dirtyRef = useRef(false);
  const debouncedSyncRef = useRef(null);

  useEffect(() => {
    authContentRef.current = authContent;

    if (isEqual(authContent, localAuthRef.current)) {
      dirtyRef.current = false;
      return;
    }

    if (!dirtyRef.current) {
      setLocalAuth(authContent);
      localAuthRef.current = authContent;
    }
  }, [authContent]);

  useEffect(() => {
    localAuthRef.current = localAuth;
  }, [localAuth]);

  useEffect(() => {
    debouncedSyncRef.current = debounce((content) => {
      syncContent(content);
    }, 400);

    return () => {
      debouncedSyncRef.current?.cancel();
      debouncedSyncRef.current = null;
    };
  }, [syncContent]);

  const flushLocalAuth = useCallback((content = localAuthRef.current) => {
    debouncedSyncRef.current?.cancel();

    if (!isEqual(content, authContentRef.current)) {
      syncContent(content);
    }

    dirtyRef.current = false;
  }, [syncContent]);

  useEffect(() => {
    return () => {
      flushLocalAuth();
    };
  }, [flushLocalAuth]);

  const updateLocalField = useCallback((key, value) => {
    setLocalAuth((currentAuth) => {
      const nextAuth = { ...currentAuth, [key]: value };
      localAuthRef.current = nextAuth;
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
    const latestAuth = localAuthRef.current;
    flushLocalAuth(latestAuth);
    onRunWithContent?.(latestAuth);
  }, [flushLocalAuth, onRunWithContent]);

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
