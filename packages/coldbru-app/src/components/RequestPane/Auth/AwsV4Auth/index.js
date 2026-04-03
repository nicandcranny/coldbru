import React from 'react';
import StyledWrapper from './StyledWrapper';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const AwsV4Auth = ({ item, collection, updateAuth, request, save }) => {
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'awsv4',
    item,
    collection,
    request,
    save,
    defaultContent: {
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
      service: '',
      region: '',
      profileName: ''
    }
  });
  const { isSensitive } = useDetectSensitiveField(collection);
  const { showWarning, warningMessage } = isSensitive(localAuth?.secretAccessKey);

  return (
    <StyledWrapper className="mt-2 w-full">
      <NativeAuthField
        label="Access Key ID"
        value={localAuth.accessKeyId || ''}
        onChange={(value) => updateLocalField('accessKeyId', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Secret Access Key"
        value={localAuth.secretAccessKey || ''}
        onChange={(value) => updateLocalField('secretAccessKey', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
        isSecret={true}
        showWarning={showWarning}
        warningMessage={warningMessage}
        fieldName="awsv4-secret-access-key"
      />
      <NativeAuthField
        label="Session Token"
        value={localAuth.sessionToken || ''}
        onChange={(value) => updateLocalField('sessionToken', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Service"
        value={localAuth.service || ''}
        onChange={(value) => updateLocalField('service', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Region"
        value={localAuth.region || ''}
        onChange={(value) => updateLocalField('region', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Profile Name"
        value={localAuth.profileName || ''}
        onChange={(value) => updateLocalField('profileName', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
    </StyledWrapper>
  );
};

export default AwsV4Auth;
