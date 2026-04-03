import React from 'react';
import StyledWrapper from './StyledWrapper';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const AwsV4Auth = ({ item, collection, updateAuth, request, save }) => {
  const dispatch = useDispatch();
  const canRun = item?.type !== 'folder';
  const syncContent = React.useCallback((content) => {
    dispatch(updateAuth({
      mode: 'awsv4',
      collectionUid: collection.uid,
      itemUid: item.uid,
      content
    }));
  }, [dispatch, updateAuth, collection.uid, item.uid]);
  const onRunWithContent = React.useCallback((content) => {
    if (!canRun) return;
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.auth = { ...(requestRoot.auth || {}), mode: 'awsv4', awsv4: content };
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [canRun, item, dispatch, collection.uid]);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'awsv4',
    request,
    save,
    syncContent,
    onRunWithContent,
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
