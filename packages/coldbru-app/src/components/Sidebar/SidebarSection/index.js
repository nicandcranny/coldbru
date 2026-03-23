import { useState, useEffect, useRef } from 'react';
import { IconChevronRight, IconChevronDown } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import { useSidebarAccordion } from '../SidebarAccordionContext';
import ActionIcon from 'ui/ActionIcon/index';

const SidebarSection = ({
  id,
  title,
  icon: Icon,
  actions,
  children,
  className = '',
  collapsible = true
}) => {
  const { isExpanded, setSectionExpanded, getExpandedCount } = useSidebarAccordion();
  const [localExpanded, setLocalExpanded] = useState(() => (collapsible ? isExpanded(id) : true));
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!collapsible) {
      setLocalExpanded(true);
      return;
    }

    const expanded = isExpanded(id);
    setLocalExpanded(expanded);
  }, [collapsible, id, isExpanded]);

  const handleToggle = () => {
    if (!collapsible) {
      return;
    }

    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    setSectionExpanded(id, newExpanded);
  };

  const expandedCount = collapsible ? getExpandedCount() : 1;
  const isOnlyExpanded = localExpanded && expandedCount === 1;

  return (
    <StyledWrapper className={className}>
      <div
        ref={sectionRef}
        className={`sidebar-section ${localExpanded ? 'expanded' : ''} ${isOnlyExpanded ? 'single-expanded' : ''} ${expandedCount > 1 && localExpanded ? 'multi-expanded' : ''} ${collapsible ? 'collapsible-section' : 'static-section'}`}
      >
        <div
          className={`section-header ${collapsible ? 'section-header-collapsible' : 'section-header-static'}`}
          onClick={collapsible ? handleToggle : undefined}
        >
          <div className="section-header-left">
            <div
              className="section-icon-wrapper"
              tabIndex={collapsible ? 0 : -1}
              onKeyDown={collapsible
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggle();
                    }
                  }
                : undefined}
            >
              {collapsible && (
                <ActionIcon size="sm" className="section-toggle">
                  {localExpanded ? (
                    <IconChevronDown size={12} stroke={1.5} />
                  ) : (
                    <IconChevronRight size={12} stroke={1.5} />
                  )}
                </ActionIcon>
              )}
              {Icon && <Icon size={14} stroke={1.5} className="section-icon" />}
            </div>
            <span className="section-title">{title}</span>
          </div>
          {actions && (
            <div
              className="section-actions"
              onClick={(e) => {
                e.stopPropagation();
                if (!localExpanded) {
                  setSectionExpanded(id, true);
                }
              }}
            >
              {actions}
            </div>
          )}
        </div>
        {localExpanded && (
          <div className="section-content">
            {children}
          </div>
        )}
      </div>
    </StyledWrapper>
  );
};

export default SidebarSection;
