import React, { useEffect, useRef, useState, useCallback } from 'react';
import useOnClickOutside from 'hooks/useOnClickOutside';
import StyledWrapper from './StyledWrapper';

const InlineEditableTitle = ({
  value,
  onSave,
  validate,
  afterDisplay = null,
  headingTag = 'h2',
  inputAriaLabel = 'Edit title',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value || '');
  const [displayValue, setDisplayValue] = useState(value || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(displayValue || '');
      setError('');
    }
  }, [displayValue, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isEditing]);

  const finishEditing = useCallback(() => {
    setIsEditing(false);
    setIsSaving(false);
    setError('');
  }, []);

  const startEditing = useCallback(() => {
    if (isSaving) {
      return;
    }

    setDraftValue(displayValue || '');
    setError('');
    setIsEditing(true);
  }, [displayValue, isSaving]);

  const cancelEditing = useCallback(() => {
    setDraftValue(displayValue || '');
    finishEditing();
  }, [displayValue, finishEditing]);

  const saveEditing = useCallback(async () => {
    if (isSaving) {
      return false;
    }

    const nextError = validate ? validate(draftValue) : null;
    if (nextError) {
      setError(nextError);
      return false;
    }

    if (draftValue === displayValue) {
      finishEditing();
      return true;
    }

    setIsSaving(true);

    try {
      await onSave(draftValue);
      setDisplayValue(draftValue);
      finishEditing();
      return true;
    } catch (err) {
      setIsSaving(false);
      setError(err?.message || 'Unable to save title');
      return false;
    }
  }, [displayValue, draftValue, finishEditing, isSaving, onSave, validate]);

  useOnClickOutside(containerRef, saveEditing, isEditing);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await saveEditing();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  };

  const TitleTag = headingTag;

  return (
    <StyledWrapper className={className} ref={containerRef}>
      <div className={`title-shell ${isEditing ? 'editing' : ''}`}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="title-input"
            value={draftValue}
            onChange={(event) => {
              setDraftValue(event.target.value);
              if (error) {
                setError('');
              }
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label={inputAriaLabel}
          />
        ) : (
          <div className="title-row">
            <div
              className="title-surface"
              role="button"
              tabIndex={0}
              onClick={startEditing}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  startEditing();
                }
              }}
            >
              <TitleTag className="title-text">{displayValue}</TitleTag>
            </div>
            {afterDisplay ? <div className="title-after">{afterDisplay}</div> : null}
          </div>
        )}
      </div>
      {error ? <div className="title-error">{error}</div> : null}
    </StyledWrapper>
  );
};

export default InlineEditableTitle;
