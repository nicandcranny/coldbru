# COMPONENTS.md — ColdBru Component Catalog

> Check here before building something new. If a component already exists, use it.

All paths are relative to `packages/coldbru-app/src/`.

## UI Primitives (`src/ui/`)

Low-level, generic building blocks. Use these first.

| Component | Path | Description |
|---|---|---|
| Button | `ui/Button` | Themed button with size/variant/color options, loading spinner, and optional icon. Props: `size`, `variant`, `color`, `disabled`, `loading`, `icon`, `iconPosition`, `fullWidth`, `rounded`, `fontWeight`. |
| ActionIcon | `ui/ActionIcon` | Icon-only button with variant styling and hover color. Polymorphic via `component` prop. Props: `variant`, `size`, `disabled`, `colorOnHover`, `color`, `label`. |
| MenuDropdown | `ui/MenuDropdown` | Full dropdown menu with keyboard nav, submenus, grouped/flat items, controlled/uncontrolled modes. Exposes `show`/`hide`/`toggle` via ref. Props: `items`, `placement`, `selectedItemId`, `opened`, `onChange`, `header`, `footer`, `showTickMark`, `groupStyle`. |
| StatusBadge | `ui/StatusBadge` | Themed status badge (danger/warning/info/success/muted) with optional left/right sections. Props: `status`, `variant`, `size`, `radius`, `leftSection`, `rightSection`. |
| MethodBadge | `ui/MethodBadge` | Color-coded HTTP method label (GET, POST, etc.). Props: `method`, `size`. |
| HeightBoundContainer | `ui/HeightBoundContainer` | Flex wrapper that constrains children height. Props: `className`. |
| ResponsiveTabs | `ui/ResponsiveTabs` | Tab bar that auto-collapses overflow into a dropdown. Props: `tabs`, `activeTab`, `onTabSelect`, `rightContent`, `delayedTabs`. |
| ErrorBanner | `ui/ErrorBanner` | Dismissible banner for a list of error title/message pairs. Props: `errors`, `onClose`. |

## Shared Components (`src/components/`)

### Layout & Feedback

| Component | Path | Description |
|---|---|---|
| Modal | `components/Modal` | Dialog with header/content/footer, focus trapping, ESC/Enter handling, backdrop click-to-close. Props: `size`, `title`, `confirmText`, `cancelText`, `handleCancel`, `handleConfirm`, `hideCancel`, `hideFooter`, `hideClose`, `disableCloseOnOutsideClick`, `confirmButtonColor`. |
| Spinner | `components/Spinner` | Loading spinner with optional child content. Props: `size`, `color`. |
| Portal | `components/Portal` | Renders children into `document.body` via React portal. |
| ErrorCapture | `components/ErrorCapture` | React error boundary + global `console.error` interceptor that dispatches to Redux debug log. |
| Notifications | `components/Notifications` | Bell icon with unread badge, opens paginated notifications modal. No props (uses Redux internally). |

### Form Controls

| Component | Path | Description |
|---|---|---|
| Checkbox | `components/Checkbox` | Styled checkbox with custom checkmark. Props: `checked`, `disabled`, `onChange`, `dataTestId`. |
| RadioButton | `components/RadioButton` | Styled radio button. Props: `checked`, `disabled`, `onChange`, `name`, `value`. |
| ToggleSwitch | `components/ToggleSwitch` | On/off toggle. Props: `isOn`, `handleToggle`, `size`, `activeColor`. |
| Dropdown | `components/Dropdown` | Tippy.js-powered dropdown triggered by an icon. Props: `icon`, `placement`, `transparent`, `visible`, `onCreate`. |
| SearchInput | `components/SearchInput` | Search text input with icon, auto-focus, and clear button. Props: `searchText`, `setSearchText`, `placeholder`. |
| ColorPicker | `components/ColorPicker` | Dropdown color picker with preset swatches and range slider. Props: `color`, `onChange`, `icon`. |
| ColorRange | `components/ColorRange` | Range slider with linear gradient background for color selection. Props: `selectedColor`, `value`, `onChange`, `colorRange`. |
| FilePickerEditor | `components/FilePickerEditor` | Native file browser button with filename display. Props: `value`, `onChange`, `collection`, `isSingleFilePicker`, `readOnly`, `displayMode`. |
| BodyModeSelector | `components/BodyModeSelector` | Dropdown for selecting HTTP body mode (JSON, XML, form, file, none). Props: `currentMode`, `onModeChange`, `modes`, `disabled`. |
| SettingsInput | `components/SettingsInput` | Simple labeled text input for settings panels. Props: `id`, `label`, `value`, `onChange`, `description`. |
| InheritableSettingsInput | `components/InheritableSettingsInput` | Settings input that toggles between "Inherit" dropdown and custom text input. Props: `id`, `label`, `value`, `isInherited`, `onDropdownSelect`, `onValueChange`, `onCustomValueReset`. |

### Data Display

| Component | Path | Description |
|---|---|---|
| Table | `components/Table` | Table with resizable columns via mouse-drag. Props: `minColumnWidth`, `headers`, `children`. |
| EditableTable | `components/EditableTable` | Key/value table with inline editing, resizable columns, row checkboxes, delete, drag-and-drop reorder. Props: `columns`, `rows`, `onChange`, `defaultRow`, `showCheckbox`, `showDelete`, `reorderable`, `onReorder`. |
| EnvironmentVariablesTable | `components/EnvironmentVariablesTable` | Virtualized env vars editor with name validation, secret toggle, draft/save workflow, search highlighting. Props: `environment`, `collection`, `onSave`, `draft`, `onDraftChange`, `searchQuery`. |
| ReorderTable | `components/ReorderTable` | `<tbody>` wrapper adding drag-and-drop reordering with grip handles. Props: `updateReorderedItem`. |
| TagList | `components/TagList` | Tag input with autocomplete hints, validation, and add/remove. Props: `tags`, `tagsHintList`, `handleAddTag`, `handleRemoveTag`, `onSave`. |
| VariablesEditor | `components/VariablesEditor` | Read-only inspector for runtime and environment variables. Props: `collection`. |

### Tabs & Navigation

| Component | Path | Description |
|---|---|---|
| Tabs | `components/Tabs` | Compound tab component (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) using context. Props: `value`, `onValueChange`. |
| Tab | `components/Tab` | Single tab button with label and optional count badge. Props: `name`, `label`, `isActive`, `onClick`, `count`. |
| Accordion | `components/Accordion` | Expand/collapse sections (`Accordion.Item`, `.Header`, `.Content`). Props: `defaultIndex`, `dataTestId`. |

### Text & Content

| Component | Path | Description |
|---|---|---|
| Markdown | `components/MarkDown` | Renders markdown as HTML with relative link rewriting. Props: `collectionPath`, `content`, `onDoubleClick`. |
| Documentation | `components/Documentation` | Toggle between CodeEditor (edit) and rendered Markdown (preview) with auto-save. Props: `item`, `collection`. |
| TruncatedText | `components/TruncatedText` | Clamps text to max lines with "View More"/"View Less" toggle. Props: `text`, `maxLines`, `showButton`. |
| InlineEditableTitle | `components/InlineEditableTitle` | Click-to-edit heading with validation, Enter/Escape/click-outside handling. Props: `value`, `onSave`, `validate`, `headingTag`. |
| PathDisplay | `components/PathDisplay` | File/folder icon next to a path string. Props: `baseName`, `iconType`. |
| BulkEditor | `components/BulkEditor` | Plain-text bulk key/value editor with toggle to table mode. Props: `params`, `onChange`, `onToggle`, `onSave`, `onRun`. |

### Editors (CodeMirror-based)

| Component | Path | Description |
|---|---|---|
| CodeEditor | `components/CodeEditor` | Full CodeMirror editor with syntax highlighting, linting, variable overlays, autocomplete, folding, search. Props: `value`, `mode`, `theme`, `readOnly`, `collection`, `item`, `onEdit`, `onRun`, `onSave`, `schema`, `font`, `fontSize`. |
| SingleLineEditor | `components/SingleLineEditor` | Single-line CodeMirror input with variable highlighting, secret masking (eye toggle), autocomplete. Props: `value`, `onChange`, `collection`, `item`, `isSecret`, `placeholder`, `autocomplete`, `highlightPathParams`. |
| MultiLineEditor | `components/MultiLineEditor` | Multi-line CodeMirror editor with variable highlighting and secret masking. Props: `value`, `onChange`, `collection`, `item`, `isSecret`, `placeholder`, `autocomplete`. |

### Indicators & Badges

| Component | Path | Description |
|---|---|---|
| ColorBadge | `components/ColorBadge` | Small colored circle dot. Props: `color`, `size`. |
| StatusDot | `components/StatusDot` | Superscript dot icon, red when error. Props: `type` (`'default'` \| `'error'`). |
| StopWatch | `components/StopWatch` | Live elapsed-time display updating every 100ms. Props: `startTime`. |
| SensitiveFieldWarning | `components/SensitiveFieldWarning` | Alert triangle icon with tooltip for sensitive fields. Props: `fieldName`, `warningMessage`. |

### Tooltips

| Component | Path | Description |
|---|---|---|
| InfoTip | `components/InfoTip` | Inline info (ⓘ) icon with react-tooltip on hover. Props: `infotipId`. |
| ToolHint | `components/ToolHint` | Theme-aware tooltip wrapper around react-tooltip. Props: `text`, `toolhintId`, `anchorSelect`, `place`, `offset`, `delayShow`. |

### Icons (`components/Icons/`)

Custom SVG icon components. Use `@tabler/icons` for standard icons; only use these for app-specific icons.

| Icon | Path |
|---|---|
| CloseAll | `components/Icons/CloseAll` |
| Dot | `components/Icons/Dot` |
| ExampleIcon | `components/Icons/ExampleIcon` |
| Grpc | `components/Icons/Grpc` |
| IconAlertTriangleFilled | `components/Icons/IconAlertTriangleFilled` |
| IconBottombarToggle | `components/Icons/IconBottombarToggle` |
| IconCaretDown | `components/Icons/IconCaretDown` |
| IconCheckMark | `components/Icons/IconCheckMark` |
| IconEdit | `components/Icons/IconEdit` |
| IconSidebarToggle | `components/Icons/IconSidebarToggle` |
| InfoCircle | `components/Icons/InfoCircle` |
| OpenAPILogo | `components/Icons/OpenAPILogo` |
| OpenAPISync | `components/Icons/OpenAPISync` |
| OpenCollectionIcon | `components/Icons/OpenCollectionIcon` |
| QuestionCircle | `components/Icons/QuestionCircle` |
| Send | `components/Icons/Send` |

## Custom Hooks (`src/hooks/`)

| Hook | Path | Description |
|---|---|---|
| useDebounce | `hooks/useDebounce` | Debounces a value by a given delay. |
| useDetectSensitiveField | `hooks/useDetectSensitiveField` | Detects if a field name matches sensitive patterns (passwords, tokens, etc.). |
| useLocalStorage | `hooks/useLocalStorage` | Reads/writes state to localStorage with a key. |
| usePrevious | `hooks/usePrevious` | Returns the previous value of a variable across renders. |
| useOnClickOutside | `hooks/useOnClickOutside` | Fires a callback when a click occurs outside a ref element. |
| useFocusTrap | `hooks/useFocusTrap` | Traps keyboard focus within a container element. |
| useTabPaneBoundaries | `hooks/useTabPaneBoundaries` | Manages tab pane resize boundaries. |
| useCollectionFolderTree | `hooks/useCollectionFolderTree` | Builds a folder tree structure from a collection for navigation. |
| useProtoFileManagement | `hooks/useProtoFileManagement` | Manages protobuf file loading and service/method selection for gRPC. |
| useReflectionManagement | `hooks/useReflectionManagement` | Manages gRPC server reflection for service discovery. |
