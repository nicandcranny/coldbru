import React, { useMemo, useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';

const NativeOAuth2Input = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder = '',
  isSecret = false,
  showWarning = false,
  warningMessage = '',
  fieldName = ''
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const inputType = useMemo(() => {
    if (!isSecret) {
      return 'text';
    }

    return showSecret ? 'text' : 'password';
  }, [isSecret, showSecret]);

  return (
    <div className="flex items-center w-full">
      <input
        type={inputType}
        className="mousetrap w-full bg-transparent"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value.replace(/[\r\n]/g, ''))}
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
