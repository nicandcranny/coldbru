import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const BearerAuth = ({ item, collection, updateAuth, request, save }) => {
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'bearer',
    item,
    collection,
    request,
    save,
    defaultContent: {
      token: ''
    }
  });
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(localAuth.token);

  return (
    <StyledWrapper className="w-full">
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
