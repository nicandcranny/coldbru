export const SIDEBAR_NAVIGABLE_SELECTOR = '[data-sidebar-navigable="true"]';

const scrollRowIntoView = (row) => {
  row?.scrollIntoView?.({
    block: 'nearest',
    inline: 'nearest'
  });
};

export const getSidebarNavigableRows = (root = document) => {
  return Array.from(root.querySelectorAll(SIDEBAR_NAVIGABLE_SELECTOR));
};

export const focusSidebarRowByOffset = (currentRow, direction, root = document) => {
  const rows = getSidebarNavigableRows(root);

  if (!rows.length) {
    return false;
  }

  const currentIndex = rows.indexOf(currentRow);
  const fallbackIndex = direction > 0 ? 0 : rows.length - 1;
  const nextIndex = currentIndex < 0
    ? fallbackIndex
    : (currentIndex + direction + rows.length) % rows.length;
  const nextRow = rows[nextIndex];

  if (!nextRow) {
    return false;
  }

  nextRow.focus();
  scrollRowIntoView(nextRow);

  return true;
};

export const focusSidebarEdgeRow = (direction, root = document) => {
  const rows = getSidebarNavigableRows(root);

  if (!rows.length) {
    return false;
  }

  const targetRow = direction > 0 ? rows[0] : rows[rows.length - 1];

  if (!targetRow) {
    return false;
  }

  targetRow.focus();
  scrollRowIntoView(targetRow);

  return true;
};
