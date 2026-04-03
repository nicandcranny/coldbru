import React, { useState, useEffect, useRef, useCallback } from 'react';
import get from 'lodash/get';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { useDispatch, useSelector } from 'react-redux';
import CodeEditor from 'components/CodeEditor';
import { updateRequestScript, updateResponseScript } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateScriptPaneTab } from 'providers/ReduxStore/slices/tabs';
import { useTheme } from 'providers/Theme';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'components/Tabs';
import StatusDot from 'components/StatusDot';

const Script = ({ item, collection }) => {
  const dispatch = useDispatch();
  const preRequestEditorRef = useRef(null);
  const postResponseEditorRef = useRef(null);
  const debouncedRequestSyncRef = useRef(null);
  const debouncedResponseSyncRef = useRef(null);
  const requestScript = item.draft ? get(item, 'draft.request.script.req') : get(item, 'request.script.req');
  const responseScript = item.draft ? get(item, 'draft.request.script.res') : get(item, 'request.script.res');
  const [localRequestScript, setLocalRequestScript] = useState(requestScript || '');
  const [localResponseScript, setLocalResponseScript] = useState(responseScript || '');
  const localRequestScriptRef = useRef(localRequestScript);
  const localResponseScriptRef = useRef(localResponseScript);
  const requestScriptRef = useRef(requestScript || '');
  const responseScriptRef = useRef(responseScript || '');
  const requestDirtyRef = useRef(false);
  const responseDirtyRef = useRef(false);

  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const focusedTab = find(tabs, (t) => t.uid === activeTabUid);
  const scriptPaneTab = focusedTab?.scriptPaneTab;

  // Default to post-response if pre-request script is empty (only when scriptPaneTab is null/undefined)
  const getDefaultTab = () => {
    const hasPreRequestScript = requestScript && requestScript.trim().length > 0;
    return hasPreRequestScript ? 'pre-request' : 'post-response';
  };

  const activeTab = scriptPaneTab || getDefaultTab();

  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);

  useEffect(() => {
    localRequestScriptRef.current = localRequestScript;
  }, [localRequestScript]);

  useEffect(() => {
    localResponseScriptRef.current = localResponseScript;
  }, [localResponseScript]);

  useEffect(() => {
    requestScriptRef.current = requestScript || '';
  }, [requestScript]);

  useEffect(() => {
    responseScriptRef.current = responseScript || '';
  }, [responseScript]);

  useEffect(() => {
    if (!requestDirtyRef.current) {
      setLocalRequestScript(requestScript || '');
    } else if (isEqual(requestScript || '', localRequestScriptRef.current)) {
      requestDirtyRef.current = false;
    }
  }, [requestScript]);

  useEffect(() => {
    if (!responseDirtyRef.current) {
      setLocalResponseScript(responseScript || '');
    } else if (isEqual(responseScript || '', localResponseScriptRef.current)) {
      responseDirtyRef.current = false;
    }
  }, [responseScript]);

  const syncRequestScript = useCallback((value) => {
    dispatch(updateRequestScript({
      script: value,
      itemUid: item.uid,
      collectionUid: collection.uid
    }));
  }, [dispatch, item.uid, collection.uid]);

  const syncResponseScript = useCallback((value) => {
    dispatch(updateResponseScript({
      script: value,
      itemUid: item.uid,
      collectionUid: collection.uid
    }));
  }, [dispatch, item.uid, collection.uid]);

  useEffect(() => {
    debouncedRequestSyncRef.current = debounce(syncRequestScript, 400);
    debouncedResponseSyncRef.current = debounce(syncResponseScript, 400);

    return () => {
      debouncedRequestSyncRef.current?.cancel();
      debouncedResponseSyncRef.current?.cancel();
    };
  }, [syncRequestScript, syncResponseScript]);

  const flushRequestScript = useCallback((value = localRequestScriptRef.current) => {
    debouncedRequestSyncRef.current?.cancel();
    if (!isEqual(value, requestScriptRef.current)) {
      syncRequestScript(value);
    } else {
      requestDirtyRef.current = false;
    }
  }, [syncRequestScript]);

  const flushResponseScript = useCallback((value = localResponseScriptRef.current) => {
    debouncedResponseSyncRef.current?.cancel();
    if (!isEqual(value, responseScriptRef.current)) {
      syncResponseScript(value);
    } else {
      responseDirtyRef.current = false;
    }
  }, [syncResponseScript]);

  useEffect(() => {
    return () => {
      flushRequestScript();
      flushResponseScript();
    };
  }, [flushRequestScript, flushResponseScript]);

  // Refresh CodeMirror when tab becomes visible
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      if (activeTab === 'pre-request' && preRequestEditorRef.current?.editor) {
        preRequestEditorRef.current.editor.refresh();
      } else if (activeTab === 'post-response' && postResponseEditorRef.current?.editor) {
        postResponseEditorRef.current.editor.refresh();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const onRequestScriptEdit = useCallback((value) => {
    requestDirtyRef.current = true;
    setLocalRequestScript(value);
    debouncedRequestSyncRef.current?.(value);
  }, []);

  const onResponseScriptEdit = useCallback((value) => {
    responseDirtyRef.current = true;
    setLocalResponseScript(value);
    debouncedResponseSyncRef.current?.(value);
  }, []);

  const onRun = useCallback(() => {
    flushRequestScript();
    flushResponseScript();
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.script = {
      ...(requestRoot.script || {}),
      req: localRequestScriptRef.current,
      res: localResponseScriptRef.current
    };
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushRequestScript, flushResponseScript, item, dispatch, collection.uid]);

  const onSave = useCallback(() => {
    flushRequestScript();
    flushResponseScript();
    dispatch(saveRequest(item.uid, collection.uid));
  }, [flushRequestScript, flushResponseScript, dispatch, item.uid, collection.uid]);

  const hasPreRequestScript = localRequestScript && localRequestScript.trim().length > 0;
  const hasPostResponseScript = localResponseScript && localResponseScript.trim().length > 0;

  const onScriptTabChange = (tab) => {
    dispatch(updateScriptPaneTab({ uid: item.uid, scriptPaneTab: tab }));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={onScriptTabChange}>
        <TabsList>
          <TabsTrigger value="pre-request">
            Pre Request
            {hasPreRequestScript && (
              <StatusDot type={item.preRequestScriptErrorMessage ? 'error' : 'default'} />
            )}
          </TabsTrigger>
          <TabsTrigger value="post-response">
            Post Response
            {hasPostResponseScript && (
              <StatusDot type={item.postResponseScriptErrorMessage ? 'error' : 'default'} />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre-request" className="mt-2" dataTestId="pre-request-script-editor">
          <CodeEditor
            ref={preRequestEditorRef}
            collection={collection}
            value={localRequestScript || ''}
            theme={displayedTheme}
            font={get(preferences, 'font.codeFont', 'default')}
            fontSize={get(preferences, 'font.codeFontSize')}
            onEdit={onRequestScriptEdit}
            mode="javascript"
            onRun={onRun}
            onSave={onSave}
            showHintsFor={['req', 'bru']}
          />
        </TabsContent>

        <TabsContent value="post-response" className="mt-2" dataTestId="post-response-script-editor">
          <CodeEditor
            ref={postResponseEditorRef}
            collection={collection}
            value={localResponseScript || ''}
            theme={displayedTheme}
            font={get(preferences, 'font.codeFont', 'default')}
            fontSize={get(preferences, 'font.codeFontSize')}
            onEdit={onResponseScriptEdit}
            mode="javascript"
            onRun={onRun}
            onSave={onSave}
            showHintsFor={['req', 'res', 'bru']}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Script;
