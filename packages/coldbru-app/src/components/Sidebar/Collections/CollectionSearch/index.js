import React from 'react';
import { IconSearch, IconX } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import { focusSidebarEdgeRow } from '../utils/keyboardNavigation';

const CollectionSearch = ({ searchText, setSearchText }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      const moved = focusSidebarEdgeRow(1);

      if (moved) {
        event.preventDefault();
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      const moved = focusSidebarEdgeRow(-1);

      if (moved) {
        event.preventDefault();
      }
    }
  };

  return (
    <StyledWrapper>
      <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
      <input
        type="text"
        name="search"
        placeholder="Search requests..."
        id="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus
        spellCheck="false"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value.toLowerCase())}
        onKeyDown={handleKeyDown}
      />
      {searchText !== '' && (
        <div className="clear-icon" onClick={() => setSearchText('')}>
          <IconX size={14} strokeWidth={1.5} />
        </div>
      )}
    </StyledWrapper>
  );
};

export default CollectionSearch;
