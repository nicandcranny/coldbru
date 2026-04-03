import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import CodeEditor from 'components/CodeEditor';
import FormUrlEncodedParams from 'components/RequestPane/FormUrlEncodedParams';
import MultipartFormParams from 'components/RequestPane/MultipartFormParams';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { updateRequestBody } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateRequestBodyScrollPosition } from 'providers/ReduxStore/slices/tabs';
import StyledWrapper from './StyledWrapper';
import FileBody from '../FileBody/index';

const setBodyContentOnItem = (targetItem, mode, content) => {
  const requestRoot = targetItem.draft ? targetItem.draft.request : targetItem.request;

  switch (mode) {
    case 'json':
      requestRoot.body.json = content;
      break;
    case 'text':
      requestRoot.body.text = content;
      break;
    case 'xml':
      requestRoot.body.xml = content;
      break;
    case 'sparql':
      requestRoot.body.sparql = content;
      break;
  }
};

const RequestBody = ({ item, collection }) => {
  const dispatch = useDispatch();
  const body = item.draft ? get(item, 'draft.request.body') : get(item, 'request.body');
  const bodyMode = item.draft ? get(item, 'draft.request.body.mode') : get(item, 'request.body.mode');
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const focusedTab = find(tabs, (t) => t.uid === activeTabUid);
  const [localBodyContent, setLocalBodyContent] = useState('');
  const isBodyDirtyRef = useRef(false);

  const bodyContent = useMemo(() => ({
    json: body.json,
    text: body.text,
    xml: body.xml,
    sparql: body.sparql
  }), [body.json, body.text, body.xml, body.sparql]);

  const currentBodyValue = bodyContent[bodyMode] || '';

  useEffect(() => {
    if (isEqual(currentBodyValue, localBodyContent)) {
      isBodyDirtyRef.current = false;
      return;
    }

    if (!isBodyDirtyRef.current) {
      setLocalBodyContent(currentBodyValue);
    }
  }, [item.uid, bodyMode, currentBodyValue]);

  const syncBodyToStore = useCallback((value) => {
    dispatch(
      updateRequestBody({
        content: value,
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );
  }, [dispatch, item.uid, collection.uid]);

  const debouncedSyncRef = useRef(null);

  useEffect(() => {
    debouncedSyncRef.current = debounce((value) => {
      syncBodyToStore(value);
    }, 400);

    return () => {
      debouncedSyncRef.current?.cancel();
      debouncedSyncRef.current = null;
    };
  }, [syncBodyToStore]);

  const flushBodySync = useCallback((value = localBodyContent) => {
    debouncedSyncRef.current?.cancel();

    if (value !== currentBodyValue) {
      syncBodyToStore(value);
    } else {
      isBodyDirtyRef.current = false;
    }
  }, [currentBodyValue, localBodyContent, syncBodyToStore]);

  const onEdit = useCallback((value) => {
    isBodyDirtyRef.current = true;
    setLocalBodyContent(value);
    debouncedSyncRef.current?.(value);
  }, []);

  const onRun = useCallback(() => {
    flushBodySync();

    const itemToRun = cloneDeep(item);
    setBodyContentOnItem(itemToRun, bodyMode, localBodyContent);

    dispatch(sendRequest(itemToRun, collection.uid));
  }, [flushBodySync, item, bodyMode, localBodyContent, dispatch, collection.uid]);

  const onSave = useCallback(() => {
    flushBodySync();
    dispatch(saveRequest(item.uid, collection.uid));
  }, [flushBodySync, dispatch, item.uid, collection.uid]);

  const onScroll = (editor) => {
    dispatch(
      updateRequestBodyScrollPosition({
        uid: focusedTab.uid,
        scrollY: editor.doc.scrollTop
      })
    );
  };

  if (['json', 'xml', 'text', 'sparql'].includes(bodyMode)) {
    let codeMirrorMode = {
      json: 'application/ld+json',
      text: 'application/text',
      xml: 'application/xml',
      sparql: 'application/sparql-query'
    };

    return (
      <StyledWrapper className="w-full" data-testid="request-body-editor">
        <CodeEditor
          collection={collection}
          item={item}
          theme={displayedTheme}
          font={get(preferences, 'font.codeFont', 'default')}
          fontSize={get(preferences, 'font.codeFontSize')}
          value={localBodyContent}
          onEdit={onEdit}
          onRun={onRun}
          onSave={onSave}
          onBlur={() => flushBodySync()}
          onScroll={onScroll}
          initialScroll={focusedTab?.requestBodyScrollPosition || 0}
          mode={codeMirrorMode[bodyMode]}
          enableVariableHighlighting={true}
          showHintsFor={['variables']}
        />
      </StyledWrapper>
    );
  }

  if (bodyMode === 'file') {
    return <FileBody item={item} collection={collection} />;
  }

  if (bodyMode === 'formUrlEncoded') {
    return <FormUrlEncodedParams item={item} collection={collection} />;
  }

  if (bodyMode === 'multipartForm') {
    return <MultipartFormParams item={item} collection={collection} />;
  }

  return <StyledWrapper className="w-full">No Body</StyledWrapper>;
};
export default RequestBody;
