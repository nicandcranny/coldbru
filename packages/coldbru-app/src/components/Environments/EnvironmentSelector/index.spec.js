import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import EnvironmentSelector from './index';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock(
  'components/Dropdown',
  () =>
    ({ children }) =>
      children
);
jest.mock(
  './StyledWrapper',
  () =>
    ({ children }) =>
      children
);
jest.mock(
  './EnvironmentListContent/index',
  () =>
    ({ onSettingsClick }) =>
      require('react').createElement(
        'button',
        { type: 'button', onClick: onSettingsClick },
        'Configure'
      )
);

const state = {
  globalEnvironments: {
    activeGlobalEnvironmentUid: 'env-1',
    globalEnvironments: [{ uid: 'env-1', name: 'Development' }]
  },
  requestTabView: {
    mode: 'all',
    collectionUid: null
  },
  tabs: {
    tabs: []
  },
  workspaces: {
    activeWorkspaceUid: 'workspace-1',
    workspaces: [
      {
        uid: 'workspace-1',
        pathname: '/workspace',
        scratchCollectionUid: 'scratch-1'
      }
    ]
  }
};

describe('EnvironmentSelector', () => {
  it('opens global environment settings without changing current view filter', () => {
    const dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) => selector(state));

    render(
      createElement(EnvironmentSelector, {
        collection: null,
        showCollectionEnv: false
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Configure' }));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tabs/addTab',
        payload: expect.objectContaining({
          type: 'global-environment-settings'
        })
      })
    );
  });
});
