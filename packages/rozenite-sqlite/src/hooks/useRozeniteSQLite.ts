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

/** Escape a value for safe SQL string interpolation */
function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  // Escape single quotes by doubling them
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Connects your React Native app to the SQLighter devtools panel.
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

      client.onMessage(EVENTS.SAVE_ROW, (payload: unknown) => {
        const { dbName, table, row, primaryKey } = payload as {
          dbName: string;
          table: string;
          row: Record<string, unknown>;
          primaryKey: string;
        };
        const pkValue = row[primaryKey];
        const columns = Object.keys(row).filter((k) => k !== primaryKey);
        const setClause = columns.map((col) => `"${col}" = ${escapeValue(row[col])}`).join(', ');
        const query = `UPDATE "${table}" SET ${setClause} WHERE "${primaryKey}" = ${escapeValue(pkValue)}`;
        configRef.current.sqlExecutor(dbName, query).then(
          () => client.send(EVENTS.MUTATION_RESULT, { success: true }),
          (error: unknown) => client.send(EVENTS.MUTATION_RESULT, {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),

      client.onMessage(EVENTS.DELETE_ROW, (payload: unknown) => {
        const { dbName, table, primaryKey, primaryKeyValue } = payload as {
          dbName: string;
          table: string;
          primaryKey: string;
          primaryKeyValue: unknown;
        };
        const query = `DELETE FROM "${table}" WHERE "${primaryKey}" = ${escapeValue(primaryKeyValue)}`;
        configRef.current.sqlExecutor(dbName, query).then(
          () => client.send(EVENTS.MUTATION_RESULT, { success: true }),
          (error: unknown) => client.send(EVENTS.MUTATION_RESULT, {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),

      client.onMessage(EVENTS.CLEAR_TABLE, (payload: unknown) => {
        const { dbName, table } = payload as { dbName: string; table: string };
        const query = `DELETE FROM "${table}"`;
        configRef.current.sqlExecutor(dbName, query).then(
          () => client.send(EVENTS.MUTATION_RESULT, { success: true }),
          (error: unknown) => client.send(EVENTS.MUTATION_RESULT, {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }),
    ];

    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }, [client]);
}
