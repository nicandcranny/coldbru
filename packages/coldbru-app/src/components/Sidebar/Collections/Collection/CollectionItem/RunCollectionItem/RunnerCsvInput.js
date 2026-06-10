import React, { useEffect, useRef, useState } from 'react';
import { IconEye, IconFileUpload, IconX } from '@tabler/icons';
import Button from 'ui/Button';
import { parseRunnerCsvFile } from 'utils/runner-csv';
import RunnerCsvPreviewModal from './RunnerCsvPreviewModal';

const RunnerCsvInput = ({ initialValue = null, onChange, onStateChange }) => {
  const fileInputRef = useRef(null);
  const [csvData, setCsvData] = useState(initialValue);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previousInitialValueRef = useRef(initialValue);

  useEffect(() => {
    if (previousInitialValueRef.current !== initialValue) {
      previousInitialValueRef.current = initialValue;
      setCsvData(initialValue || null);
      setErrorMessage('');
    }
  }, [initialValue]);

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);
    setErrorMessage('');

    try {
      const parsed = await parseRunnerCsvFile(file);
      setCsvData(parsed);
      onChange(parsed);
    } catch (error) {
      setCsvData(null);
      onChange(null);
      setErrorMessage(error.message || 'Failed to read CSV file');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearCsv = () => {
    setCsvData(null);
    setErrorMessage('');
    onChange(null);
  };

  useEffect(() => {
    onStateChange?.({
      isParsing,
      hasError: !!errorMessage,
      rowCount: csvData?.rowCount || 0
    });
  }, [csvData?.rowCount, errorMessage, isParsing, onStateChange]);

  return (
    <>
      <div className="runner-csv-panel mb-6" data-testid="runner-csv-panel">
        <div className="runner-csv-header">
          <div className="font-medium">Use CSV to run</div>
          <div className="text-xs text-muted mt-1">
            CSV header fields become variables. Each row runs collection or folder once.
          </div>
        </div>

        <div className="runner-csv-actions mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelected}
            data-testid="runner-csv-file-input"
          />
          <Button
            type="button"
            size="sm"
            color="secondary"
            variant="ghost"
            icon={<IconFileUpload size={16} strokeWidth={1.5} />}
            onClick={() => fileInputRef.current?.click()}
            loading={isParsing}
            className="runner-csv-button"
          >
            {csvData ? 'Replace CSV' : 'Upload CSV'}
          </Button>

          {csvData ? (
            <>
              <Button
                type="button"
                size="sm"
                color="secondary"
                variant="ghost"
                icon={<IconEye size={16} strokeWidth={1.5} />}
                onClick={() => setIsPreviewOpen(true)}
                className="runner-csv-button"
              >
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                color="secondary"
                variant="ghost"
                icon={<IconX size={16} strokeWidth={1.5} />}
                onClick={clearCsv}
                className="runner-csv-button"
              >
                Remove
              </Button>
            </>
          ) : null}
        </div>

        {isParsing ? <div className="text-xs text-muted mt-3">Reading CSV file...</div> : null}
        {errorMessage ? <div className="warning text-xs mt-3">{errorMessage}</div> : null}

        {csvData ? (
          <div className="runner-csv-summary mt-4" data-testid="runner-csv-summary">
            <div className="font-medium">{csvData.fileName}</div>
            <div className="text-xs text-muted mt-1">
              Loaded {csvData.rowCount} iterations across {csvData.variableCount} variables
            </div>
          </div>
        ) : null}
      </div>

      {isPreviewOpen ? <RunnerCsvPreviewModal csvData={csvData} onClose={() => setIsPreviewOpen(false)} /> : null}
    </>
  );
};

export default RunnerCsvInput;
