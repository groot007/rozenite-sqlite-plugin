# SQLighter

A [Rozenite](https://www.rozenite.dev) devtools plugin for inspecting and editing SQLite databases in React Native apps — directly from your browser devtools panel.

---

## Features

- **Multi-database support** — switch between any number of SQLite databases at runtime
- **Table explorer** — browse all tables of the selected database
- **Spreadsheet view** — paginated table with column sorting, per-column filtering, and highlighted search matches
- **Row editor** — click any row to open a right-side panel with editable fields, Save / Cancel and Delete actions
- **Universal SQL executor** — works with any SQLite library (`expo-sqlite`, native bridge adapters, etc.)
- **Dark GitHub-style UI** with sticky sorted headers, smooth scrollbars, and shadow-separated panels

---

## Workspace structure

```
rozenite-sqlite-plugin/
├── apps/
│   └── database-example-app/      # Expo test app wiring up the plugin
└── packages/
    └── rozenite-sqlite/           # The plugin package (published)
        ├── src/
        │   ├── panel.tsx          # Root panel component
        │   ├── theme.ts           # Color palette + shared types
        │   ├── mockData.ts        # Dev-mode mock data (shown when no device connected)
        │   ├── hooks/
        │   │   └── useExplorerState.ts   # useReducer state + real/mock client effects
        │   └── components/
        │       ├── Toolbar.tsx        # DB / table dropdowns + row/col badges
        │       ├── DataTable.tsx      # Paginated spreadsheet with sort & filter
        │       ├── Pagination.tsx     # Page controls + page-size selector
        │       ├── RowDetailPanel.tsx # Right-side row editor
        │       └── Dropdown.tsx       # Reusable custom select
        ├── package.json
        └── vite.config.ts
```

---

## Getting started

### 1. Install

```bash
npm install rozenite-sqlite
# or
yarn add rozenite-sqlite
```

### 2. Register the plugin in your app

```ts
import { useRozeniteSQLite } from 'rozenite-sqlite';

useRozeniteSQLite({
  databases: [
    { name: 'app.db', sqlExecutor: mySQLiteExecutor },
  ],
});
```

`sqlExecutor` is any function matching:

```ts
type SQLExecutor = (dbName: string, query: string) => Promise<Record<string, unknown>[]>;
```

This makes the plugin database-library-agnostic — wire it to `expo-sqlite`, `op-sqlite`, a native bridge, or anything else.

### 3. Open Rozenite devtools

With the app running, open the Rozenite devtools panel in your browser. The **SQLighter** plugin will appear automatically.

---

## Development

```bash
# Install all workspace deps
yarn install

# Run the example app (Expo)
yarn run:app

# Run the plugin in dev/watch mode
yarn run:plugin:dev
```

The example app at `apps/database-example-app` seeds several tables and connects to the plugin so you can iterate on the UI with real data.

---

## UI reference

| Area | Description |
|---|---|
| **Toolbar** | Database dropdown → Table dropdown → row/col count badges |
| **Data table** | Sticky header, sortable columns (click), per-column filter (⌕ icon), alternating rows |
| **Pagination bar** | Showing X–Y of N rows · page buttons · page-size selector (10 / 25 / 50 / 100) |
| **Row detail panel** | Editable fields, dirty indicator (blue dot), Save / Cancel buttons, small Delete button at bottom |

---

## License

MIT
