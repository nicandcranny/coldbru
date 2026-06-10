import React from 'react';
import Modal from 'components/Modal';
import Button from 'ui/Button';

const RunnerCsvPreviewModal = ({ csvData, onClose }) => {
  if (!csvData) {
    return null;
  }

  return (
    <Modal size="lg" title="CSV Preview" hideFooter={true} handleCancel={onClose}>
      <div className="csv-preview-modal">
        <div className="csv-preview-summary mb-4">
          <div className="font-medium">{csvData.fileName}</div>
          <div className="text-xs text-muted">
            {csvData.rowCount} iterations using {csvData.variableCount} variables
          </div>
        </div>
        <div className="csv-preview-note mb-3 text-xs text-muted">
          Top row shows variable names. Each row below is one runner iteration.
        </div>
        <div className="csv-preview-table-wrap">
          <table className="csv-preview-table">
            <thead>
              <tr>
                <th>Row</th>
                {csvData.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.rows.map((row, index) => (
                <tr key={`${row.iterationIndex}-${index}`}>
                  <td>Iteration {index + 1}</td>
                  {row.values.map((value, valueIndex) => (
                    <td key={`${row.iterationIndex}-${csvData.headers[valueIndex]}`}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <Button type="button" color="secondary" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RunnerCsvPreviewModal;
