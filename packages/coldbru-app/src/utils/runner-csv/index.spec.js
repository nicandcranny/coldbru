import { parseRunnerCsvFile } from './index';

const createFile = (content, name = 'data.csv') => new File([content], name, { type: 'text/csv' });

describe('parseRunnerCsvFile', () => {
  it('parses headers and rows into iteration variables', async () => {
    const parsed = await parseRunnerCsvFile(createFile('email,name\none@example.com,Ada\ntwo@example.com,Grace'));

    expect(parsed.headers).toEqual(['email', 'name']);
    expect(parsed.rowCount).toBe(2);
    expect(parsed.rows[0]).toEqual({
      iterationIndex: 0,
      values: ['one@example.com', 'Ada'],
      variables: {
        email: 'one@example.com',
        name: 'Ada'
      }
    });
  });

  it('supports quoted commas and newlines', async () => {
    const parsed = await parseRunnerCsvFile(createFile('name,notes\n"Ada, Jr.","line 1\nline 2"'));

    expect(parsed.rows[0].variables).toEqual({
      name: 'Ada, Jr.',
      notes: 'line 1\nline 2'
    });
  });

  it('trims headers, skips empty rows, pads missing cells, and ignores extras', async () => {
    const parsed = await parseRunnerCsvFile(createFile(' email , name \nada@example.com\n\nalan@example.com,Alan,extra'));

    expect(parsed.headers).toEqual(['email', 'name']);
    expect(parsed.rows).toEqual([
      {
        iterationIndex: 0,
        values: ['ada@example.com', ''],
        variables: {
          email: 'ada@example.com',
          name: ''
        }
      },
      {
        iterationIndex: 1,
        values: ['alan@example.com', 'Alan'],
        variables: {
          email: 'alan@example.com',
          name: 'Alan'
        }
      }
    ]);
  });

  it('rejects empty or duplicate headers', async () => {
    await expect(parseRunnerCsvFile(createFile('email,,name\none,two,three'))).rejects.toThrow('CSV header names cannot be empty');
    await expect(parseRunnerCsvFile(createFile('email,email\none,two'))).rejects.toThrow('Duplicate CSV header: email');
  });
});
