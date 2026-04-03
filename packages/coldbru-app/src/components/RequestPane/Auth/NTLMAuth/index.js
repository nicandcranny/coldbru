import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const NTLMAuth = ({ item, collection, request, save, updateAuth }) => {
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'ntlm',
    item,
    collection,
    request,
    save,
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
