import React, { useRef, forwardRef, useEffect } from 'react';
import { IconCaretDown } from '@tabler/icons';
import Dropdown from 'components/Dropdown';
import StyledWrapper from './StyledWrapper';
import { humanizeRequestAPIKeyPlacement } from 'utils/collections';
import NativeAuthField from '../NativeAuthField';
import useLocalAuthMode from '../useLocalAuthMode';

const ApiKeyAuth = ({ item, collection, updateAuth, request, save }) => {
  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);
  const { localAuth, updateLocalField, handleInputKeyDown, flushLocalAuth } = useLocalAuthMode({
    mode: 'apikey',
    item,
    collection,
    request,
    save,
    defaultContent: {
      key: '',
      value: '',
      placement: 'header'
    }
  });

  const Icon = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-end auth-type-label select-none">
        {humanizeRequestAPIKeyPlacement(localAuth?.placement)}
        <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
      </div>
    );
  });

  useEffect(() => {
    if (!localAuth?.placement) {
      updateLocalField('placement', 'header');
    }
  }, [localAuth?.placement, updateLocalField]);

  return (
    <StyledWrapper className="w-full">
      <NativeAuthField
        label="Key"
        value={localAuth.key || ''}
        onChange={(value) => updateLocalField('key', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />
      <NativeAuthField
        label="Value"
        value={localAuth.value || ''}
        onChange={(value) => updateLocalField('value', value)}
        onBlur={() => flushLocalAuth()}
        onKeyDown={handleInputKeyDown}
      />

      <label className="block mb-1">Add To</label>
      <div className="inline-flex items-center cursor-pointer auth-placement-selector w-fit">
        <Dropdown onCreate={onDropdownCreate} icon={<Icon />} placement="bottom-end">
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef?.current?.hide();
              updateLocalField('placement', 'header');
              flushLocalAuth({ ...localAuth, placement: 'header' });
            }}
          >
            Header
          </div>
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef?.current?.hide();
              updateLocalField('placement', 'queryparams');
              flushLocalAuth({ ...localAuth, placement: 'queryparams' });
            }}
          >
            Query Param
          </div>
        </Dropdown>
      </div>
    </StyledWrapper>
  );
};

export default ApiKeyAuth;
