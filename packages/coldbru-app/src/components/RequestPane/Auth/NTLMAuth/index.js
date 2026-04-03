import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const NTLMAuth = ({ item, collection, request, save, updateAuth }) => {
  const dispatch = useDispatch();
  const canRun = item?.type !== 'folder';
  const syncContent = React.useCallback((content) => {
    dispatch(updateAuth({
      mode: 'ntlm',
      collectionUid: collection.uid,
      itemUid: item.uid,
      content
    }));
  }, [dispatch, updateAuth, collection.uid, item.uid]);
  const onRunWithContent = React.useCallback((content) => {
    if (!canRun) return;
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.auth = { ...(requestRoot.auth || {}), mode: 'ntlm', ntlm: content };
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [canRun, item, dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'ntlm',
    request,
    save,
    syncContent,
    onRunWithContent,
    defaultContent: {
      username: '',
      password: '',
      domain: ''
    }
  });
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(localAuth?.password);

  return (
    <StyledWrapper className="mt-2 w-full">
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
        fieldName="ntlm-password"
      />
      <NativeAuthField
        label="Domain"
        value={localAuth.domain || ''}
        onChange={(value) => updateLocalField('domain', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
    </StyledWrapper>
  );
};

export default NTLMAuth;
