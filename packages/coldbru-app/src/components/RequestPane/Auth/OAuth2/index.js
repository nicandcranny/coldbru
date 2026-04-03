import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import StyledWrapper from './StyledWrapper';
import GrantTypeSelector from './GrantTypeSelector/index';
import OAuth2PasswordCredentials from './PasswordCredentials/index';
import OAuth2AuthorizationCode from './AuthorizationCode/index';
import OAuth2Implicit from './Implicit/index';
import OAuth2ClientCredentials from './ClientCredentials/index';
import { updateAuth } from 'providers/ReduxStore/slices/collections';
import { saveRequest, sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import useLocalAuthMode from '../useLocalAuthMode';
import defaultOAuth2Auth from './defaultOAuth2Auth';

const GrantTypeComponentMap = ({ grantType, sharedProps }) => {
  switch (grantType) {
    case 'password':
      return <OAuth2PasswordCredentials {...sharedProps} />;
    case 'authorization_code':
      return <OAuth2AuthorizationCode {...sharedProps} />;
    case 'implicit':
      return <OAuth2Implicit {...sharedProps} />;
    case 'client_credentials':
      return <OAuth2ClientCredentials {...sharedProps} />;
    default:
      return <div>TBD</div>;
  }
};

const OAuth2 = ({ item, collection }) => {
  const request = item.draft ? get(item, 'draft.request', {}) : get(item, 'request', {});
  const oAuth = get(request, 'auth.oauth2', {});
  const dispatch = useDispatch();
  const syncContent = useCallback((content) => {
    dispatch(updateAuth({
      mode: 'oauth2',
      collectionUid: collection.uid,
      itemUid: item.uid,
      content
    }));
  }, [dispatch, collection.uid, item.uid]);
  const save = useCallback(() => {
    dispatch(saveRequest(item.uid, collection.uid));
  }, [dispatch, item.uid, collection.uid]);
  const onRunWithContent = useCallback((content) => {
    const itemToRun = cloneDeep(item);
    const requestRoot = itemToRun.draft ? itemToRun.draft.request : itemToRun.request;
    requestRoot.auth = {
      ...(requestRoot.auth || {}),
      mode: 'oauth2',
      oauth2: content
    };
    dispatch(sendRequest(itemToRun, collection.uid));
  }, [dispatch, item, collection.uid]);
  const { localAuth, updateLocalField, handleSave, handleRun, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'oauth2',
    request,
    save,
    syncContent,
    onRunWithContent,
    defaultContent: defaultOAuth2Auth
  });
  const selectorRequest = useMemo(() => ({
    ...request,
    auth: {
      ...(request.auth || {}),
      oauth2: localAuth
    }
  }), [request, localAuth]);
  const grantType = localAuth?.grantType || 'authorization_code';
  const handleGrantTypeChange = useCallback((grantType) => {
    updateLocalField('grantType', grantType);
  }, [updateLocalField]);
  const sharedProps = useMemo(() => ({
    item,
    save: handleSave,
    request: selectorRequest,
    handleRun,
    updateLocalField,
    handleInputKeyDown,
    flushLocalAuth,
    collection
  }), [item, handleSave, selectorRequest, handleRun, updateLocalField, handleInputKeyDown, flushLocalAuth, collection]);

  return (
    <StyledWrapper className="w-full">
      <GrantTypeSelector request={selectorRequest} onGrantTypeChange={handleGrantTypeChange} />
      <GrantTypeComponentMap grantType={grantType} sharedProps={sharedProps} />
    </StyledWrapper>
  );
};

export default OAuth2;
