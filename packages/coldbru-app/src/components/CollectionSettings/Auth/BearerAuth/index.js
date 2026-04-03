import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from 'components/RequestPane/Auth/NativeAuthField';
import useLocalAuthMode from 'components/RequestPane/Auth/useLocalAuthMode';

const BearerAuth = ({ collection }) => {
  const dispatch = useDispatch();
  const bearerToken = collection.draft?.root ? get(collection, 'draft.root.request.auth.bearer.token', '') : get(collection, 'root.request.auth.bearer.token', '');
  const syncContent = React.useCallback((content) => {
    dispatch(updateCollectionAuth({
      mode: 'bearer',
      collectionUid: collection.uid,
      content
    }));
  }, [dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'bearer',
    request: { auth: { bearer: { token: bearerToken } } },
    save: () => dispatch(saveCollectionSettings(collection.uid)),
    syncContent,
    defaultContent: { token: '' }
  });
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(localAuth.token);

  return (
    <StyledWrapper className="mt-2 w-full">
      <NativeAuthField
        label="Token"
        value={localAuth.token || ''}
        onChange={(value) => updateLocalField('token', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
        isSecret={true}
        showWarning={showWarning}
        warningMessage={warningMessage}
        fieldName="bearer-token"
      />
    </StyledWrapper>
  );
};

export default BearerAuth;
