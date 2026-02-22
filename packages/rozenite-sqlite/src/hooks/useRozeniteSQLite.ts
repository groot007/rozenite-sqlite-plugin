import { useEffect, useRef } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { EVENTS, PLUGIN_ID } from '../constants';

export type SQLExecutor = (
  dbName: string,
  query: string,
) => Promise<Record<string, unknown>[]>;

export interface RozeniteSQLiteConfig {
  /** List of database names exposed to the devtools panel, e.g. ["app.db", "cache.db"] */
  databases: string[];
  /** Library-agnostic SQL runner — receives the db name and raw query, returns rows */
  sqlExecutor: SQLExecutor;
}

/**
 * Connects your React Native app to the Rozenite SQLite devtools panel.
 *
 * Call this once somewhere near the root of your app (or in the component
 * that holds the database instances). It handles all devtools communication —
 * you don't need to touch the plugin-bridge directly.
 *
 * @example
 * useRozeniteSQLite({
 *   databases: ['app.db', 'cache.db'],
 *   sqlExecutor: async (dbName, query) => {
 *     const db = myDatabases[dbName];
 *     return db.getAllAsync(query);
 *   },
 * });
 */
export function useRozeniteSQLite(config: RozeniteSQLiteConfig): void {
  const client = useRozeniteDevToolsClient({ pluginId: PLUGIN_ID });

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    if (!client) return;

    const subs = [
      client.onMessage(EVENTS.GET_DB_LIST, () => {
        client.send(EVENTS.SEND_DB_LIST, configRef.current.databases);
      }),

      client.onMessage(EVENTS.SQL_EXECUTE, (payload: unknown) => {
        const { dbName, query } = payload as { dbName: string; query: string };
        configRef.current.sqlExecutor(dbName, query).then(
          (rows) => {
            client.send(EVENTS.SQL_EXEC_RESULT, rows);
          },
          (error: unknown) => {
            client.send(EVENTS.SQL_EXEC_RESULT, {
              error: error instanceof Error ? error.message : String(error),
            });
          },
        );
      }),
    ];

    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }, [client]);
}
