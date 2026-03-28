require('@testing-library/jest-dom');

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { Provider } = require('react-redux');
const { configureStore } = require('@reduxjs/toolkit');

const mockRenameEnvironment = jest.fn();
const mockUpdateTab = jest.fn((payload) => ({ type: 'tabs/updateTab', payload }));
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('providers/ReduxStore/slices/collections/actions', () => ({
  renameEnvironment: (...args) => mockRenameEnvironment(...args),
  updateEnvironmentColor: jest.fn(() => ({ type: 'collections/updateEnvironmentColor' }))
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
      onClick: () => onSave('Renamed Env')
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
    tabs: (state = { activeTabUid: 'env-tab-1' }) => state
  }
});

describe('Collection EnvironmentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenameEnvironment.mockImplementation(() => () => Promise.resolve());
  });

  it('updates the active tab title after renaming an environment', async () => {
    const store = createStore();

    render(
      React.createElement(
        Provider,
        { store },
        React.createElement(EnvironmentDetails, {
          environment: { uid: 'env-1', name: 'Old Env', color: '#fff' },
          collection: { uid: 'collection-1', environments: [{ uid: 'env-1', name: 'Old Env' }] },
          setIsModified: jest.fn(),
          searchQuery: '',
          setSearchQuery: jest.fn(),
          isSearchExpanded: false,
          setIsSearchExpanded: jest.fn(),
          debouncedSearchQuery: '',
          searchInputRef: { current: null }
        })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Old Env' }));

    await waitFor(() => {
      expect(mockRenameEnvironment).toHaveBeenCalledWith('Renamed Env', 'env-1', 'collection-1');
      expect(mockUpdateTab).toHaveBeenCalledWith({
        uid: 'env-tab-1',
        tabName: 'Renamed Env'
      });
    });
  });
});
