export const openSidebarSection = (sectionId, detail = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('sidebar-section-open', {
    detail: {
      sectionId,
      ...detail
    }
  }));
};
