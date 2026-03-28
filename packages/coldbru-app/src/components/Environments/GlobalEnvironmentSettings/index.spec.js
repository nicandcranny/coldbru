require('@testing-library/jest-dom');

const React = require('react');
const { render, screen } = require('@testing-library/react');
const { Provider } = require('react-redux');
const { configureStore } = require('@reduxjs/toolkit');

jest.mock('providers/ReduxStore/slices/global-environments', () => ({
  selectGlobalEnvironment: jest.fn((payload) => ({ type: 'globalEnvironments/select', payload }))
}));

jest.mock('components/WorkspaceHome/WorkspaceEnvironments/EnvironmentList/EnvironmentDetails', () => ({ environment }) => {
  const mockReact = require('react');
  return mockReact.createElement('div', null, environment.name);
});

const GlobalEnvironmentSettings = require('./index').default;

const createStore = (overrides = {}) => configureStore({
  reducer: {
    tabs: (state = { activeTabUid: 'global-env-tab-1' }) => state,
    globalEnvironments: (
      state = {
        globalEnvironments: [{ uid: 'env-1', name: 'Old Global Env', color: '#fff' }],
        activeGlobalEnvironmentUid: 'env-1'
      }
    ) => ({ ...state, ...overrides.globalEnvironments })
  }
});

describe('Global environment rename regressions', () => {
  it('falls back to the active global environment when the tab still points to a stale uid', () => {
    const store = createStore({
      globalEnvironments: {
        globalEnvironments: [{ uid: 'env-2', name: 'Renamed Global Env', color: '#fff' }],
        activeGlobalEnvironmentUid: 'env-2'
      }
    });

    render(
      React.createElement(
        Provider,
        { store },
        React.createElement(GlobalEnvironmentSettings, {
          environmentUid: 'stale-env-uid'
        })
      )
    );

    expect(screen.getByText('Renamed Global Env')).toBeInTheDocument();
    expect(screen.queryByText('Global variable not found')).not.toBeInTheDocument();
  });
});
