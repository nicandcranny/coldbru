import React from 'react';
import get from 'lodash/get';
import MenuDropdown from 'ui/MenuDropdown';
import StyledWrapper from './StyledWrapper';
import { IconCaretDown, IconKey } from '@tabler/icons';
import { humanizeGrantType } from 'utils/collections';

const GrantTypeSelector = ({ request, onGrantTypeChange }) => {
  const oAuth = get(request, 'auth.oauth2', {});

  return (
    <StyledWrapper>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconKey size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          Grant Type
        </span>
      </div>
      <div className="inline-flex items-center cursor-pointer grant-type-mode-selector w-fit">
        <MenuDropdown
          items={[
            { id: 'password', label: 'Password Credentials', onClick: () => onGrantTypeChange?.('password') },
            { id: 'authorization_code', label: 'Authorization Code', onClick: () => onGrantTypeChange?.('authorization_code') },
            { id: 'implicit', label: 'Implicit', onClick: () => onGrantTypeChange?.('implicit') },
            { id: 'client_credentials', label: 'Client Credentials', onClick: () => onGrantTypeChange?.('client_credentials') }
          ]}
          selectedItemId={oAuth?.grantType}
          placement="bottom-end"
        >
          <div className="flex items-center justify-end grant-type-label select-none">
            {humanizeGrantType(oAuth?.grantType)} <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};
export default GrantTypeSelector;
