require('@testing-library/jest-dom');

const React = require('react');
const { fireEvent, render, screen } = require('@testing-library/react');

jest.mock('components/ToolHint', () => ({ children }) => {
  const mockReact = require('react');
  return mockReact.createElement(mockReact.Fragment, null, children);
});

jest.mock('components/ColorBadge', () => () => {
  const mockReact = require('react');
  return mockReact.createElement('span', { 'data-testid': 'color-badge' });
});

const EnvironmentListContent = require('./index').default;

const renderComponent = (props = {}) => {
  const defaultProps = {
    environments: [
      { uid: 'env-1', name: 'Development', color: '#00ff00' },
      { uid: 'env-2', name: 'Staging', color: '#ffaa00' }
    ],
    hasEnvironments: true,
    activeEnvironmentUid: 'env-2',
    description: 'Create one',
    searchText: '',
    setSearchText: jest.fn(),
    isOpen: true,
    onEnvironmentSelect: jest.fn(),
    onSettingsClick: jest.fn(),
    onCreateClick: jest.fn(),
    onImportClick: jest.fn(),
    onClose: jest.fn()
  };

  const allProps = { ...defaultProps, ...props };

  render(React.createElement(EnvironmentListContent, allProps));

  return allProps;
};

describe('EnvironmentListContent keyboard navigation', () => {
  it('selects first matching environment with ArrowDown then Enter while searching', () => {
    const props = renderComponent({
      environments: [{ uid: 'env-1', name: 'Development', color: '#00ff00' }],
      searchText: 'dev'
    });

    const searchInput = screen.getByPlaceholderText('Search environments...');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(props.onEnvironmentSelect).toHaveBeenCalledWith({
      uid: 'env-1',
      name: 'Development',
      color: '#00ff00'
    });
  });

  it('cycles through default options and can activate no environment', () => {
    const props = renderComponent();
    const searchInput = screen.getByPlaceholderText('Search environments...');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(props.onEnvironmentSelect).toHaveBeenCalledWith(null);
  });

  it('wraps navigation to configure and triggers settings', () => {
    const props = renderComponent({
      environments: [{ uid: 'env-1', name: 'Development', color: '#00ff00' }]
    });
    const searchInput = screen.getByPlaceholderText('Search environments...');

    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(props.onSettingsClick).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const props = renderComponent();
    const searchInput = screen.getByPlaceholderText('Search environments...');

    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(props.onClose).toHaveBeenCalled();
  });
});
