import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from 'components/RequestPane/Auth/NativeAuthField';
import useLocalAuthMode from 'components/RequestPane/Auth/useLocalAuthMode';

const WsseAuth = ({ collection }) => {
  const dispatch = useDispatch();
  const wsseAuth = collection.draft?.root ? get(collection, 'draft.root.request.auth.wsse', {}) : get(collection, 'root.request.auth.wsse', {});
  const syncContent = React.useCallback((content) => {
    dispatch(updateCollectionAuth({
      mode: 'wsse',
      collectionUid: collection.uid,
      content
    }));
  }, [dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'wsse',
    request: { auth: { wsse: wsseAuth } },
    save: () => dispatch(saveCollectionSettings(collection.uid)),
    syncContent,
    defaultContent: {
      username: '',
      password: ''
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
        fieldName="wsse-password"
      />
    </StyledWrapper>
  );
};

export default WsseAuth;
