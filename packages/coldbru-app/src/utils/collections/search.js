import { isItemARequest, isItemAFolder } from './index';

const normalizeSearchText = (searchText = '') => searchText.trim().toLowerCase();

const doesItemNameMatchSearchText = (item, searchText = '') => {
  const normalizedSearchText = normalizeSearchText(searchText);

  if (!normalizedSearchText) {
    return false;
  }

  return item?.name?.toLowerCase().includes(normalizedSearchText);
};

const getSearchableItems = (items = []) => items.filter((item) => !item?.isTransient);

const getTreeSearchState = (item, searchText = '') => {
  if (isItemARequest(item)) {
    const isDirectMatch = doesItemNameMatchSearchText(item, searchText);

    return {
      hasMatchingRequestInSubtree: isDirectMatch,
      isCollapsedInSearch: false,
      isDirectMatch,
      shouldShow: isDirectMatch,
      showAllChildrenOnExpand: false
    };
  }

  const isDirectMatch = doesItemNameMatchSearchText(item, searchText);
  const childStates = getSearchableItems(item?.items).map((child) => getTreeSearchState(child, searchText));
  const hasVisibleDescendant = childStates.some((childState) => childState.shouldShow);
  const hasMatchingRequestInSubtree = childStates.some((childState) => childState.hasMatchingRequestInSubtree);
  const showAllChildrenOnExpand = isDirectMatch && !hasMatchingRequestInSubtree;

  return {
    hasMatchingRequestInSubtree,
    isCollapsedInSearch: showAllChildrenOnExpand,
    isDirectMatch,
    shouldShow: isDirectMatch || hasVisibleDescendant,
    showAllChildrenOnExpand
  };
};

export const doesRequestMatchSearchText = (request, searchText = '') => {
  return doesItemNameMatchSearchText(request, searchText);
};

export const doesCollectionMatchSearchText = (collection, searchText = '') => {
  return doesItemNameMatchSearchText(collection, searchText);
};

export const doesFolderMatchSearchText = (folder, searchText = '') => {
  return doesItemNameMatchSearchText(folder, searchText);
};

export const getFolderSearchState = (folder, searchText = '') => {
  if (!isItemAFolder(folder)) {
    return {
      hasMatchingRequestInSubtree: false,
      isCollapsedInSearch: false,
      isDirectMatch: false,
      shouldShow: false,
      showAllChildrenOnExpand: false
    };
  }

  return getTreeSearchState(folder, searchText);
};

export const doesFolderHaveItemsMatchSearchText = (item, searchText = '') => {
  return getFolderSearchState(item, searchText).shouldShow;
};

export const doesCollectionHaveItemsMatchingSearchText = (collection, searchText = '') => {
  return getCollectionSearchState(collection, searchText).shouldShow;
};

export const getCollectionSearchState = (collection, searchText = '') => {
  const isDirectMatch = doesCollectionMatchSearchText(collection, searchText);
  const childStates = getSearchableItems(collection?.items).map((item) => getTreeSearchState(item, searchText));
  const hasVisibleDescendant = childStates.some((childState) => childState.shouldShow);
  const hasMatchingRequestInSubtree = childStates.some((childState) => childState.hasMatchingRequestInSubtree);
  const showAllChildrenOnExpand = isDirectMatch && !hasMatchingRequestInSubtree;

  return {
    hasMatchingRequestInSubtree,
    isCollapsedInSearch: showAllChildrenOnExpand,
    isDirectMatch,
    shouldShow: isDirectMatch || hasVisibleDescendant,
    showAllChildrenOnExpand
  };
};
