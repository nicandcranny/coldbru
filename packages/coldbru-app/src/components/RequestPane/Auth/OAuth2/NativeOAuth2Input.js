import React, { useMemo, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import NativeAutocompleteInput from 'components/NativeAutocompleteInput';
import VariableHintsContext from '../VariableHintsContext';

const NativeOAuth2Input = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = '',
  variableHints = [],
  variableContext = {},
  isSecret = false,
  showWarning = false,
  warningMessage = '',
  fieldName = ''
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
    <div className="flex items-center w-full">
      <NativeAutocompleteInput
        type={inputType}
        className="grow"
        inputClassName="mousetrap w-full bg-transparent"
        value={value || ''}
        placeholder={placeholder}
        variableHints={variableHints?.length ? variableHints : contextAutocomplete.hints}
        variableContext={Object.keys(variableContext || {}).length ? variableContext : contextAutocomplete.variables}
        onChange={(nextValue) => onChange(nextValue.replace(/[\r\n]/g, ''))}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {isSecret ? (
        <button
          type="button"
          className="mx-2"
          onClick={() => setShowSecret((current) => !current)}
        >
          {showSecret ? <IconEye size={18} strokeWidth={2} /> : <IconEyeOff size={18} strokeWidth={2} />}
        </button>
      ) : null}
      {showWarning ? <SensitiveFieldWarning fieldName={fieldName} warningMessage={warningMessage} /> : null}
    </div>
  );
};

export default NativeOAuth2Input;
