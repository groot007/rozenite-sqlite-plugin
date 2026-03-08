# rozenite-sqlite

A [Rozenite](https://rozenite.dev) devtools plugin that adds a live SQLite explorer panel to your React Native app. Browse your databases, inspect tables, run arbitrary SQL queries, and view row details — all from the Rozenite devtools panel without leaving your development workflow.

## Requirements

- React Native app using [Rozenite devtools](https://rozenite.dev)
- A SQLite library (e.g. [`expo-sqlite`](https://docs.expo.dev/versions/latest/sdk/sqlite/), [`op-sqlite`](https://github.com/OP-Engineering/op-sqlite), [`react-native-quick-sqlite`](https://github.com/margelo/react-native-quick-sqlite)) — any library works as long as you can execute raw SQL queries

## Installation

```sh
npm install rozenite-sqlite
```

Make sure you also have the Rozenite devtools set up in your project. Refer to the [Rozenite docs](https://rozenite.dev/docs) for the initial setup.

## Usage

Call `useRozeniteSQLite` once near the root of your app (or in the component that holds your database instances). The hook handles all communication with the devtools panel — you don't interact with the plugin bridge directly.

The `sqlExecutor` callback is fully library-agnostic — you provide the bridge between the plugin and whichever SQLite library you use. It receives the database name and a raw SQL string, and must return a `Promise<Record<string, unknown>[]>` (an array of row objects).

```tsx
import { useRozeniteSQLite } from 'rozenite-sqlite/react-native';

export default function App() {
  useRozeniteSQLite({
    databases: ['app.db', 'cache.db'],
    sqlExecutor: async (dbName, query) => {
      // Use any SQLite library here — see examples below
      const db = myDatabases[dbName];
      return db.getAllAsync(query);
    },
  });

  // ... rest of your app
}
```

### With expo-sqlite (`openDatabaseSync`)

```tsx
import * as SQLite from 'expo-sqlite';
import { useRozeniteSQLite } from 'rozenite-sqlite/react-native';

export default function App() {
  useRozeniteSQLite({
    databases: ['app.db', 'cache.db'],
    sqlExecutor: async (dbName, query) => {
      const db = SQLite.openDatabaseSync(dbName);
      return db.getAllSync(query) as Record<string, unknown>[];
    },
  });

  // ...
}
```

> `openDatabaseSync` returns the existing open connection if the database is already open, so it's safe to call on every query without storing the instance.

### With expo-sqlite (`openDatabaseAsync`)

```tsx
import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { useRozeniteSQLite } from 'rozenite-sqlite/react-native';

export default function App() {
  const [databases, setDatabases] = useState<Record<string, SQLite.SQLiteDatabase>>({});

  useEffect(() => {
    const setup = async () => {
      const app = await SQLite.openDatabaseAsync('app.db');
      const cache = await SQLite.openDatabaseAsync('cache.db');
      setDatabases({ app, cache });
    };
    setup();
  }, []);

  useRozeniteSQLite({
    databases: Object.keys(databases).map((key) => `${key}.db`),
    sqlExecutor: async (dbName, query) => {
      const key = dbName.replace(/\.db$/, '');
      const db = databases[key];
      if (!db) throw new Error(`Database "${dbName}" not found`);
      return db.getAllAsync(query) as Promise<Record<string, unknown>[]>;
    },
  });

  // ...
}
```

### With a custom native module

```tsx
import { useRozeniteSQLite } from 'rozenite-sqlite/react-native';
import SqliteServiceModule from './SqliteServiceModule';

export default function App() {
  useRozeniteSQLite({
    databases: ['app.db'],
    sqlExecutor: async (dbName, query) => {
      const result = await SqliteServiceModule.execute(dbName, query, true);
      return JSON.parse(result) as Record<string, unknown>[];
    },
  });

  // ...
}
```

### With op-sqlite

```tsx
import { open } from '@op-engineering/op-sqlite';
import { useRozeniteSQLite } from 'rozenite-sqlite/react-native';

const db = open({ name: 'app.db' });

export default function App() {
  useRozeniteSQLite({
    databases: ['app.db'],
    sqlExecutor: async (_dbName, query) => {
      const result = db.execute(query);
      return result.rows?._array ?? [];
    },
  });

  // ...
}
```

## API

### `useRozeniteSQLite(config)`

A React hook that connects your app to the Rozenite SQLite devtools panel.

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.databases` | `string[]` | List of database names exposed to the panel, e.g. `["app.db", "cache.db"]` |
| `config.sqlExecutor` | `(dbName: string, query: string) => Promise<Record<string, unknown>[]>` | Library-agnostic SQL runner — receives the database name and a raw SQL query, returns an array of row objects |

The hook has no return value. It registers message handlers for the devtools panel and cleans them up automatically when the component unmounts or when the client reconnects.

## Devtools Panel Features

Once connected, the Rozenite SQLite panel provides:

- **Database switcher** — select from all registered databases
- **Table browser** — list all user tables in the selected database
- **Data grid** — paginated view of rows with column headers
- **Row detail panel** — inspect all fields of a selected row
- **SQL console** — run arbitrary `SELECT` (or any) queries against the selected database
- **Refresh** — reload the current table data on demand

## License

MIT
