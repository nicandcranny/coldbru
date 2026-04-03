import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const WsseAuth = ({ item, collection, updateAuth, request, save }) => {
  const dispatch = useDispatch();
  const canRun = item?.type !== 'folder';
  const syncContent = React.useCallback((content) => {
    dispatch(updateAuth({
      mode: 'wsse',
      collectionUid: collection.uid,
      itemUid: item.uid,
      content
    }));
  }, [dispatch, updateAuth, collection.uid, item.uid]);
  const onRunWithContent = React.useCallback((content) => {
    if (!canRun) return;
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.auth = { ...(requestRoot.auth || {}), mode: 'wsse', wsse: content };
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [canRun, item, dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'wsse',
    request,
    save,
    syncContent,
    onRunWithContent,
    defaultContent: {
      username: '',
      password: ''
    }
  });
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(localAuth?.password);

  return (
    <StyledWrapper className="w-full">
      <NativeAuthField
        label="Username"
        value={localAuth.username || ''}
        onChange={(value) => updateLocalField('username', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Password"
        value={localAuth.password || ''}
        onChange={(value) => updateLocalField('password', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
        isSecret={true}
        showWarning={showWarning}
        warningMessage={warningMessage}
        fieldName="wsse-password"
      />
    </StyledWrapper>
  );
};

export default WsseAuth;
