require('@testing-library/jest-dom');

const React = require('react');
const { act, fireEvent, render, screen, waitFor } = require('@testing-library/react');
const { Provider } = require('react-redux');
const { configureStore, createSlice } = require('@reduxjs/toolkit');
let mockUuidCounter = 0;

jest.mock('react-virtuoso', () => ({
  TableVirtuoso: ({ data, fixedHeaderContent, itemContent, components = {} }) => {
    const mockReact = require('react');
    const TableRow = components.TableRow || (({ children }) => mockReact.createElement('tr', null, children));

    return mockReact.createElement(
      'table',
      null,
      mockReact.createElement('thead', null, fixedHeaderContent()),
      mockReact.createElement(
        'tbody',
        null,
        data.map((item, index) => mockReact.createElement(
          TableRow,
          {
            key: `${item.variable?.uid || item.uid || index}`,
            item: item.variable || item
          },
          itemContent(index, item)
        ))
      )
    );
  }
}));

jest.mock('components/MultiLineEditor/index', () => ({ name, value, onChange }) => {
  const mockReact = require('react');

  return mockReact.createElement('textarea', {
    'aria-label': name,
    'value': value,
    'onChange': (event) => onChange(event.target.value)
  });
});

jest.mock('providers/Theme', () => ({
  useTheme: () => ({
    storedTheme: 'dark',
    theme: {
      colors: {
        accent: '#00a2ff'
      }
    }
  })
}));

jest.mock('utils/common', () => ({
  uuid: jest.fn(() => {
    mockUuidCounter += 1;
    return `test-uuid-${mockUuidCounter}`;
  })
}));

jest.mock('./StyledWrapper', () => {
  const mockReact = require('react');

  return ({ children, ...props }) => mockReact.createElement('div', props, children);
});

const EnvironmentVariablesTable = require('./index').default;

const createStore = () => {
  const globalEnvironmentsSlice = createSlice({
    name: 'globalEnvironments',
    initialState: {
      globalEnvironments: [],
      activeGlobalEnvironmentUid: null
    },
    reducers: {}
  });

  return configureStore({
    reducer: {
      globalEnvironments: globalEnvironmentsSlice.reducer
    }
  });
};

const renderTable = (props = {}) => {
  const store = createStore();

  const defaultProps = {
    environment: {
      uid: 'env-1',
      variables: []
    },
    collection: {
      uid: 'collection-1'
    },
    onSave: jest.fn(() => Promise.resolve()),
    draft: null,
    onDraftChange: jest.fn(),
    onDraftClear: jest.fn(),
    setIsModified: jest.fn()
  };

  return render(
    React.createElement(
      Provider,
      { store },
      React.createElement(EnvironmentVariablesTable, { ...defaultProps, ...props })
    )
  );
};

describe('EnvironmentVariablesTable', () => {
  beforeEach(() => {
    mockUuidCounter = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('disables save until there are changes, then enables it', async () => {
    renderTable();

    const saveButton = screen.getByTestId('save-env');
    expect(saveButton).toBeDisabled();

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Name'), {
        target: { value: 'API_URL', name: '0.name', id: '0.name' }
      });
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => expect(saveButton).toBeEnabled());
  });
});
