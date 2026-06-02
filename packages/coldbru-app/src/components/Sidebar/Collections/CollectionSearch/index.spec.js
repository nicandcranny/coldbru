require('@testing-library/jest-dom');

const React = require('react');
const { fireEvent, render, screen } = require('@testing-library/react');

jest.mock('./StyledWrapper', () => ({ children }) => {
  const mockReact = require('react');
  return mockReact.createElement('div', null, children);
});

const CollectionSearch = require('./index').default;

const createSidebarRow = (label) => {
  const row = document.createElement('button');
  row.type = 'button';
  row.textContent = label;
  row.setAttribute('data-sidebar-navigable', 'true');
  row.scrollIntoView = jest.fn();

  document.body.appendChild(row);

  return row;
};

describe('CollectionSearch keyboard navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('moves focus to first visible sidebar row with ArrowDown', () => {
    const setSearchText = jest.fn();
    const firstRow = createSidebarRow('Collection A');
    createSidebarRow('Collection B');

    render(React.createElement(CollectionSearch, {
      searchText: '',
      setSearchText
    }));

    fireEvent.keyDown(screen.getByPlaceholderText('Search requests...'), { key: 'ArrowDown' });

    expect(firstRow).toHaveFocus();
  });

  it('moves focus to last visible sidebar row with ArrowUp', () => {
    const setSearchText = jest.fn();
    createSidebarRow('Collection A');
    const lastRow = createSidebarRow('Collection B');

    render(React.createElement(CollectionSearch, {
      searchText: '',
      setSearchText
    }));

    fireEvent.keyDown(screen.getByPlaceholderText('Search requests...'), { key: 'ArrowUp' });

    expect(lastRow).toHaveFocus();
  });

  it('keeps typing behavior unchanged', () => {
    const setSearchText = jest.fn();

    render(React.createElement(CollectionSearch, {
      searchText: '',
      setSearchText
    }));

    fireEvent.change(screen.getByPlaceholderText('Search requests...'), {
      target: { value: 'Billing' }
    });

    expect(setSearchText).toHaveBeenCalledWith('billing');
  });
});
