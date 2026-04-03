import React, { useMemo, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import NativeAutocompleteInput from 'components/NativeAutocompleteInput';
import VariableHintsContext from './VariableHintsContext';

const NativeAuthField = ({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  variableHints = [],
  variableContext = {},
  isSecret = false,
  showWarning = false,
  warningMessage = '',
  fieldName = '',
  placeholder = ''
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const contextAutocomplete = React.useContext(VariableHintsContext);
  const inputType = useMemo(() => {
    if (!isSecret) {
      return 'text';
    }

    return showSecret ? 'text' : 'password';
  }, [isSecret, showSecret]);

  return (
    <>
      <label className="block mb-1">{label}</label>
      <div className="native-auth-input-wrapper mb-3 flex items-center">
        <NativeAutocompleteInput
          type={inputType}
          className="grow"
          inputClassName="native-auth-input mousetrap"
          value={value || ''}
          placeholder={placeholder}
          variableHints={variableHints?.length ? variableHints : contextAutocomplete.hints}
          variableContext={Object.keys(variableContext || {}).length ? variableContext : contextAutocomplete.variables}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {isSecret ? (
          <button
            type="button"
            className="native-auth-visibility-toggle mx-2"
            onClick={() => setShowSecret((current) => !current)}
          >
            {showSecret ? <IconEye size={18} strokeWidth={2} /> : <IconEyeOff size={18} strokeWidth={2} />}
          </button>
        ) : null}
        {showWarning ? <SensitiveFieldWarning fieldName={fieldName} warningMessage={warningMessage} /> : null}
      </div>
    </>
  );
};

export default NativeAuthField;
