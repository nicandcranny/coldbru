import { SidebarAccordionProvider } from './SidebarAccordionContext';
import SidebarContent from './SidebarContent';
import StyledWrapper from './StyledWrapper';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateLeftSidebarWidth, updateIsDragging } from 'providers/ReduxStore/slices/app';
import CollectionsSection from './Sections/CollectionsSection/index';
import ApiSpecsSection from './Sections/ApiSpecsSection/index';
import GlobalVariablesSection from './Sections/GlobalVariablesSection';
import SourceControlSection from './Sections/SourceControlSection';
import { IconBox, IconFileCode, IconGitBranch, IconWorld } from '@tabler/icons';
import { openSidebarSection } from 'utils/sidebar';

const MIN_LEFT_SIDEBAR_WIDTH = 220;
const MAX_LEFT_SIDEBAR_WIDTH = 600;

const SIDEBAR_SECTIONS = [
  {
    id: 'collections',
    title: 'Collections',
    icon: IconBox,
    getProps: ({ collectionSearchTrigger }) => ({
      collapsible: false,
      searchTrigger: collectionSearchTrigger
    }),
    component: CollectionsSection
  },
  {
    id: 'api-specs',
    title: 'API Specs',
    icon: IconFileCode,
    getProps: () => ({
      collapsible: false
    }),
    component: ApiSpecsSection
  },
  {
    id: 'global-variables',
    title: 'Global Environments',
    icon: IconWorld,
    getProps: () => ({
      collapsible: false
    }),
    component: GlobalVariablesSection
  },
  {
    id: 'source-control',
    title: 'Source Control',
    icon: IconGitBranch,
    getProps: () => ({
      collapsible: false
    }),
    component: SourceControlSection
  }
];

const Sidebar = () => {
  const leftSidebarWidth = useSelector((state) => state.app.leftSidebarWidth);
  const sidebarCollapsed = useSelector((state) => state.app.sidebarCollapsed);
  const tabs = useSelector((state) => state.tabs?.tabs || []);
  const activeTabUid = useSelector((state) => state.tabs?.activeTabUid);
  const [asideWidth, setAsideWidth] = useState(leftSidebarWidth);
  const lastWidthRef = useRef(leftSidebarWidth);
  const [activeSectionId, setActiveSectionId] = useState('collections');
  const [collectionSearchTrigger, setCollectionSearchTrigger] = useState(0);
  const activeTab = tabs.find((tab) => tab.uid === activeTabUid) || null;

  const dispatch = useDispatch();
  const [dragging, setDragging] = useState(false);

  const currentWidth = sidebarCollapsed ? 0 : asideWidth;

  // Clamp helper keeps width in allowed range
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const handleMouseMove = (e) => {
    if (!dragging || sidebarCollapsed) return;
    e.preventDefault();
    const nextWidth = clamp(e.clientX + 2, MIN_LEFT_SIDEBAR_WIDTH, MAX_LEFT_SIDEBAR_WIDTH);
    if (Math.abs(nextWidth - lastWidthRef.current) < 3) return;
    lastWidthRef.current = nextWidth;
    setAsideWidth(nextWidth);
  };

  const handleMouseUp = (e) => {
    if (dragging) {
      e.preventDefault();
      setDragging(false);
      dispatch(
        updateLeftSidebarWidth({
          leftSidebarWidth: asideWidth
        })
      );
      dispatch(
        updateIsDragging({
          isDragging: false
        })
      );
    }
  };
  const handleDragbarMouseDown = (e) => {
    e.preventDefault();
    if (sidebarCollapsed) {
      return;
    }
    setDragging(true);
    dispatch(
      updateIsDragging({
        isDragging: true
      })
    );
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragging, asideWidth]);

  useEffect(() => {
    setAsideWidth(leftSidebarWidth);
  }, [leftSidebarWidth]);

  useEffect(() => {
    const handleSidebarSearch = () => {
      setActiveSectionId('collections');
      setCollectionSearchTrigger((value) => value + 1);
    };

    const handleSidebarSectionOpen = (event) => {
      const sectionId = event?.detail?.sectionId;
      if (sectionId) {
        setActiveSectionId(sectionId);
      }
    };

    window.addEventListener('sidebar-search-open', handleSidebarSearch);
    window.addEventListener('sidebar-section-open', handleSidebarSectionOpen);
    return () => {
      window.removeEventListener('sidebar-search-open', handleSidebarSearch);
      window.removeEventListener('sidebar-section-open', handleSidebarSectionOpen);
    };
  }, []);

  useEffect(() => {
    if (activeTab?.type !== 'global-environment-settings' || !activeTab.environmentUid) {
      return;
    }

    setActiveSectionId('global-variables');

    setTimeout(() => {
      openSidebarSection('global-variables', {
        focusEnvironmentUid: activeTab.environmentUid
      });
    }, 0);
  }, [activeTab?.environmentUid, activeTab?.type]);

  return (
    <SidebarAccordionProvider defaultExpanded={['collections']}>
      <StyledWrapper className="flex relative h-full">
        <aside className="sidebar" style={{ width: currentWidth, transition: dragging ? 'none' : 'width 0.2s ease-in-out' }}>
          <div className="flex flex-row h-full w-full">
            <div className="flex flex-col w-full" style={{ width: asideWidth }}>
              <div className="flex flex-col flex-grow sidebar-sections-container" style={{ minHeight: 0, overflow: 'hidden' }}>
                <div className="sidebar-sections flex flex-col flex-1">
                  <SidebarContent
                    sections={SIDEBAR_SECTIONS}
                    activeSectionId={activeSectionId}
                    activeButtonId={activeSectionId}
                    onSectionChange={setActiveSectionId}
                    sectionContext={{
                      collectionSearchTrigger
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {!sidebarCollapsed && (
          <div className="absolute sidebar-drag-handle h-full" onMouseDown={handleDragbarMouseDown}>
            <div className="drag-request-border" />
          </div>
        )}
      </StyledWrapper>
    </SidebarAccordionProvider>
  );
};

export default Sidebar;
