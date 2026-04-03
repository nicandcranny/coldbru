import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from 'components/RequestPane/Auth/NativeAuthField';
import useLocalAuthMode from 'components/RequestPane/Auth/useLocalAuthMode';

const BasicAuth = ({ collection }) => {
  const dispatch = useDispatch();
  const basicAuth = collection.draft?.root ? get(collection, 'draft.root.request.auth.basic', {}) : get(collection, 'root.request.auth.basic', {});
  const syncContent = React.useCallback((content) => {
    dispatch(updateCollectionAuth({
      mode: 'basic',
      collectionUid: collection.uid,
      content
    }));
  }, [dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'basic',
    request: { auth: { basic: basicAuth } },
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
        fieldName="basic-password"
      />
    </StyledWrapper>
  );
};

export default BasicAuth;
