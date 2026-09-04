import { describe, expect, it, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useDispatch, useStore } from 'react-redux';
import useIpcEvents from './useIpcEvents';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useStore: jest.fn()
}));

const GLOBAL_ENVIRONMENT_EVENTS = [
  'main:global-environment-added',
  'main:global-environment-changed',
  'main:global-environment-deleted'
];

describe('useIpcEvents', () => {
  it('reloads global environments after a workspace environment file changes', async () => {
    const handlers = {};
    const on = jest.fn((channel, handler) => {
      handlers[channel] = handler;
      return jest.fn();
    });
    const invoke = jest.fn().mockResolvedValue({
      globalEnvironments: [],
      activeGlobalEnvironmentUid: null
    });
    window.ipcRenderer = { invoke, on };
    useDispatch.mockReturnValue(jest.fn());
    useStore.mockReturnValue({
      getState: () => ({
        workspaces: {
          activeWorkspaceUid: 'workspace-1',
          workspaces: [{ uid: 'workspace-1', pathname: '/workspace' }]
        }
      })
    });

    const { unmount } = renderHook(() => useIpcEvents());

    expect(on.mock.calls.map(([channel]) => channel)).toEqual(
      expect.arrayContaining(GLOBAL_ENVIRONMENT_EVENTS)
    );
    handlers['main:global-environment-changed']('workspace-1');
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('renderer:get-global-environments', {
        workspaceUid: 'workspace-1',
        workspacePath: '/workspace'
      });
    });
    unmount();
  });
});
