import { useEffect, useRef } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';

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
  const client = useRozeniteDevToolsClient({ pluginId: 'rozenite-sqlite' });

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    if (!client) return;

    const subs = [
      client.onMessage('get-db-list', () => {
        client.send('send-db-list', configRef.current.databases);
      }),

      client.onMessage('sql-execute', async (payload: { dbName: string; query: string }) => {
        try {
          const rows = await configRef.current.sqlExecutor(payload.dbName, payload.query);
          client.send('sql-exec-result', rows);
        } catch (error: any) {
          client.send('sql-exec-result', { error: error?.message ?? String(error) });
        }
      }),
    ];

    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }, [client]);
}
