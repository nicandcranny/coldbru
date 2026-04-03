import React, { useMemo, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';

const NativeAuthField = ({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  isSecret = false,
  showWarning = false,
  warningMessage = '',
  fieldName = '',
  placeholder = ''
}) => {
  const [showSecret, setShowSecret] = useState(false);
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
        <input
          type={inputType}
          className="native-auth-input mousetrap"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={value || ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
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
