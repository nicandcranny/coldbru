import Papa from 'papaparse';

const trimHeader = (header) => {
  if (typeof header !== 'string') {
    return '';
  }

  return header.trim();
};

const isRowEmpty = (row = []) => {
  return row.every((cell) => `${cell ?? ''}`.trim() === '');
};

const readFileAsText = async (file) => {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => resolve(event.target?.result || '');
    fileReader.onerror = (error) => reject(error);
    fileReader.readAsText(file);
  });
};

export const parseRunnerCsvFile = async (file) => {
  if (!file) {
    throw new Error('No CSV file selected');
  }

  const text = await readFileAsText(file);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      delimiter: ',',
      skipEmptyLines: false,
      complete: ({ data, errors }) => {
        if (errors?.length) {
          return reject(new Error(errors[0]?.message || 'Failed to parse CSV file'));
        }

        if (!Array.isArray(data) || data.length === 0) {
          return reject(new Error('CSV file is empty'));
        }

        const [rawHeaders = [], ...rawRows] = data;
        const headers = rawHeaders.map(trimHeader);

        if (!headers.length || headers.every((header) => !header)) {
          return reject(new Error('CSV header row is required'));
        }

        if (headers.some((header) => !header)) {
          return reject(new Error('CSV header names cannot be empty'));
        }

        const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
        if (duplicateHeaders.length) {
          return reject(new Error(`Duplicate CSV header: ${duplicateHeaders[0]}`));
        }

        const rows = rawRows
          .filter((row) => Array.isArray(row) && !isRowEmpty(row))
          .map((row, index) => {
            const normalizedCells = headers.map((_, headerIndex) => `${row[headerIndex] ?? ''}`);
            const variables = headers.reduce((acc, header, headerIndex) => {
              acc[header] = normalizedCells[headerIndex];
              return acc;
            }, {});

            return {
              iterationIndex: index,
              values: normalizedCells,
              variables
            };
          });

        resolve({
          type: 'csv',
          fileName: file.name,
          headers,
          rows,
          rowCount: rows.length,
          variableCount: headers.length
        });
      },
      error: (error) => reject(error)
    });
  });
};
