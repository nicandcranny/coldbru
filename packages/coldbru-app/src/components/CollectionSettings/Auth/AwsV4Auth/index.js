import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { updateCollectionAuth } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import NativeAuthField from 'components/RequestPane/Auth/NativeAuthField';
import useLocalAuthMode from 'components/RequestPane/Auth/useLocalAuthMode';

const AwsV4Auth = ({ collection }) => {
  const dispatch = useDispatch();
  const awsv4Auth = collection.draft?.root ? get(collection, 'draft.root.request.auth.awsv4', {}) : get(collection, 'root.request.auth.awsv4', {});
  const syncContent = React.useCallback((content) => {
    dispatch(updateCollectionAuth({
      mode: 'awsv4',
      collectionUid: collection.uid,
      content
    }));
  }, [dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'awsv4',
    request: { auth: { awsv4: awsv4Auth } },
    save: () => dispatch(saveCollectionSettings(collection.uid)),
    syncContent,
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
      <NativeAuthField label="Access Key ID" value={localAuth.accessKeyId || ''} onChange={(value) => updateLocalField('accessKeyId', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} />
      <NativeAuthField label="Secret Access Key" value={localAuth.secretAccessKey || ''} onChange={(value) => updateLocalField('secretAccessKey', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} isSecret={true} showWarning={showWarning} warningMessage={warningMessage} fieldName="awsv4-secret-access-key" />
      <NativeAuthField label="Session Token" value={localAuth.sessionToken || ''} onChange={(value) => updateLocalField('sessionToken', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} />
      <NativeAuthField label="Service" value={localAuth.service || ''} onChange={(value) => updateLocalField('service', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} />
      <NativeAuthField label="Region" value={localAuth.region || ''} onChange={(value) => updateLocalField('region', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} />
      <NativeAuthField label="Profile Name" value={localAuth.profileName || ''} onChange={(value) => updateLocalField('profileName', value)} onBlur={() => flushLocalAuth()} onKeyDown={handleInputKeyDown} />
    </StyledWrapper>
  );
};

export default AwsV4Auth;
