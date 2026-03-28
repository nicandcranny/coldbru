require('@testing-library/jest-dom');

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { Provider } = require('react-redux');
const { configureStore } = require('@reduxjs/toolkit');

const mockRenameGlobalEnvironment = jest.fn();
const mockUpdateTab = jest.fn((payload) => ({ type: 'tabs/updateTab', payload }));
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('providers/ReduxStore/slices/global-environments', () => ({
  renameGlobalEnvironment: (...args) => mockRenameGlobalEnvironment(...args),
  updateGlobalEnvironmentColor: jest.fn(() => ({ type: 'globalEnvironments/updateColor' }))
}));

jest.mock('providers/ReduxStore/slices/tabs', () => ({
  updateTab: (...args) => mockUpdateTab(...args)
}));

jest.mock('react-hot-toast', () => ({
  success: (...args) => mockToastSuccess(...args),
  error: (...args) => mockToastError(...args)
}));

jest.mock('components/InlineEditableTitle', () => ({ value, onSave }) => {
  const mockReact = require('react');

  return mockReact.createElement(
    'button',
    {
      type: 'button',
      onClick: () => onSave('Renamed Global Env')
    },
    value
  );
});

jest.mock('components/ColorPicker', () => () => null);
jest.mock('./EnvironmentVariables', () => () => null);
jest.mock('./StyledWrapper', () => {
  const mockReact = require('react');
  return ({ children }) => mockReact.createElement('div', null, children);
});

const EnvironmentDetails = require('./index').default;

const createStore = () => configureStore({
  reducer: {
    tabs: (state = { activeTabUid: 'global-env-tab-1' }) => state,
    globalEnvironments: (state = {
      globalEnvironments: [{ uid: 'env-1', name: 'Old Global Env', color: '#fff' }],
      activeGlobalEnvironmentUid: 'env-1'
    }) => state
  }
});

describe('Workspace global EnvironmentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenameGlobalEnvironment.mockImplementation(() => () => Promise.resolve('env-2'));
  });

  it('updates the active tab title and environment uid after renaming a global environment', async () => {
    const store = createStore();

    render(
      React.createElement(
        Provider,
        { store },
        React.createElement(EnvironmentDetails, {
          environment: { uid: 'env-1', name: 'Old Global Env', color: '#fff' },
          setIsModified: jest.fn(),
          collection: null,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          isSearchExpanded: false,
          setIsSearchExpanded: jest.fn(),
          debouncedSearchQuery: '',
          searchInputRef: { current: null }
        })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Old Global Env' }));

    await waitFor(() => {
      expect(mockRenameGlobalEnvironment).toHaveBeenCalledWith({
        name: 'Renamed Global Env',
        environmentUid: 'env-1'
      });
      expect(mockUpdateTab).toHaveBeenCalledWith({
        uid: 'global-env-tab-1',
        tabName: 'Renamed Global Env',
        environmentUid: 'env-2'
      });
    });
  });
});
