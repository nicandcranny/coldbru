## Differences from the Original Bruno

### All Section

Add `All` group to the active tabs list to see all active tabs in one place.

### Global Search Improvement

- Global search now supports global environment variables
- Global search now supports prefix for targetted search: 
  - `env:` for environment variable
  - `col:` for collections
  - `req:` for requests
  - `spec:` for API specs
- Global search now directly jumps and auto-scroll to the selected item on the left sidebar

### Global Environment as a Global Settings

- Global environment is now a generic settings applied to all collections, where the dropdown is always shown on the top bar

### Activity Bar Menu

- Create a new activity bar menu (vs-code like) and move the menu to choose between collections, API specs, and global environment variables to the activity bar menu

### Improve Request Search

Improve request search on the sidebar to allow search for collection names, folders, and requests

### Minor Bug Fixes

- Flaky global environment variables sort is fixed

## Future Improvements

- Instant action (like cmd+shift+p) - for git, etc.
- Add open file feature in the Git 
- Add send to top and send to bottom button in collections list
- Init page to replace the "Where should we store" to start with create collection
