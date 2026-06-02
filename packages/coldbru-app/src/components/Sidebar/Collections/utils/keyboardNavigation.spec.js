require('@testing-library/jest-dom');

const {
  SIDEBAR_NAVIGABLE_SELECTOR,
  focusSidebarRowByOffset,
  focusSidebarEdgeRow,
  getSidebarNavigableRows
} = require('./keyboardNavigation');

const createRow = (label) => {
  const row = document.createElement('button');
  row.type = 'button';
  row.textContent = label;
  row.setAttribute('data-sidebar-navigable', 'true');
  row.scrollIntoView = jest.fn();

  return row;
};

describe('sidebar keyboard navigation helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns all navigable sidebar rows in DOM order', () => {
    const firstRow = createRow('First');
    const secondRow = createRow('Second');

    document.body.append(firstRow, secondRow);

    expect(getSidebarNavigableRows()).toEqual([firstRow, secondRow]);
    expect(document.querySelectorAll(SIDEBAR_NAVIGABLE_SELECTOR)).toHaveLength(2);
  });

  it('moves focus to next row and wraps around', () => {
    const firstRow = createRow('First');
    const secondRow = createRow('Second');

    document.body.append(firstRow, secondRow);
    firstRow.focus();

    expect(focusSidebarRowByOffset(firstRow, 1)).toBe(true);
    expect(secondRow).toHaveFocus();

    expect(focusSidebarRowByOffset(secondRow, 1)).toBe(true);
    expect(firstRow).toHaveFocus();
  });

  it('moves focus to previous row from current row', () => {
    const firstRow = createRow('First');
    const secondRow = createRow('Second');
    const thirdRow = createRow('Third');

    document.body.append(firstRow, secondRow, thirdRow);
    secondRow.focus();

    expect(focusSidebarRowByOffset(secondRow, -1)).toBe(true);
    expect(firstRow).toHaveFocus();
  });

  it('focuses first or last row from search input handoff', () => {
    const firstRow = createRow('First');
    const secondRow = createRow('Second');

    document.body.append(firstRow, secondRow);

    expect(focusSidebarEdgeRow(1)).toBe(true);
    expect(firstRow).toHaveFocus();

    expect(focusSidebarEdgeRow(-1)).toBe(true);
    expect(secondRow).toHaveFocus();
  });

  it('returns false when no rows exist', () => {
    expect(focusSidebarRowByOffset(null, 1)).toBe(false);
    expect(focusSidebarEdgeRow(1)).toBe(false);
  });
});
