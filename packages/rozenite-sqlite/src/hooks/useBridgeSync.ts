import { useEffect, useRef, useCallback } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import { EVENTS, PLUGIN_ID, QUERIES } from '../constants';
import type { RowData } from '../theme';
import type { Action } from './useExplorerState';

type BridgeClient = ReturnType<typeof useRozeniteDevToolsClient>;

function fetchTables(client: NonNullable<BridgeClient>, dbName: string) {
  client.send(EVENTS.SQL_EXECUTE, { dbName, query: QUERIES.LIST_TABLES });
}

function fetchData(client: NonNullable<BridgeClient>, dbName: string, tableName: string) {
  client.send(EVENTS.SQL_EXECUTE, { dbName, query: `SELECT * FROM "${tableName}"` });
}

export function useBridgeSync(
  dispatch: React.Dispatch<Action>,
  selectedDB: string | null,
  selectedTable: string | null,
) {
  const client = useRozeniteDevToolsClient({ pluginId: PLUGIN_ID });
  const pendingRef = useRef<'tables' | 'data' | 'clear' | 'query' | null>(null);
  const selectedDBRef = useRef(selectedDB);
  const selectedTableRef = useRef(selectedTable);
  const customQueryResolverRef = useRef<((r: { rows: RowData[]; columns: string[]; error?: string }) => void) | null>(null);
  useEffect(() => { selectedDBRef.current = selectedDB; }, [selectedDB]);
  useEffect(() => { selectedTableRef.current = selectedTable; }, [selectedTable]);

  useEffect(() => {
    if (!client) return;
    // Reset state fully so the DB→tables→data cascade re-runs cleanly.
    // This prevents the race where effects 2 & 3 both fire on reconnect/hot-reload.
    dispatch({ type: 'RESET' });
    client.send(EVENTS.GET_DB_LIST, true);

    const sub1 = client.onMessage(EVENTS.SEND_DB_LIST, (payload: unknown) => {
      const databases = Array.isArray(payload) ? (payload as string[]) : [];
      dispatch({ type: 'SET_DATABASES', databases });
    });

    const sub2 = client.onMessage(EVENTS.SQL_EXEC_RESULT, (payload: unknown) => {
      const mode = pendingRef.current;
      const isError = payload !== null && typeof payload === 'object' && 'error' in payload;
      const errorMsg = isError ? String((payload as { error: unknown }).error) : null;

      if (mode === 'query') {
        const resolver = customQueryResolverRef.current;
        customQueryResolverRef.current = null;
        pendingRef.current = null;
        resolver?.(
          isError
            ? { rows: [], columns: [], error: errorMsg! }
            : (() => {
                const rows: RowData[] = Array.isArray(payload) ? (payload as RowData[]) : [];
                return { rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] };
              })(),
        );
        return;
      }

      if (isError) {
        dispatch({ type: 'SET_ERROR', error: errorMsg! });
        return;
      }

      if (mode === 'tables') {
        const tables = Array.isArray(payload)
          ? (payload as Array<{ name: string }>).map((r) => r.name)
          : [];
        dispatch({ type: 'SET_TABLES', tables });
      } else if (mode === 'data') {
        const rows: RowData[] = Array.isArray(payload) ? (payload as RowData[]) : [];
        dispatch({ type: 'SET_DATA', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
      } else if (mode === 'clear') {
        const db = selectedDBRef.current;
        const table = selectedTableRef.current;
        if (db && table) {
          pendingRef.current = 'data';
          dispatch({ type: 'LOAD_DATA_START' });
          fetchData(client, db, table);
        }
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [client, dispatch]);

  // No `client` in deps — driven purely by state changes from the cascade above.
  // This prevents effects 2 & 3 from firing simultaneously when client reconnects.
  useEffect(() => {
    if (!client || !selectedDB) return;
    pendingRef.current = 'tables';
    dispatch({ type: 'LOAD_TABLES_START' });
    fetchTables(client, selectedDB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDB, dispatch]);

  useEffect(() => {
    if (!client || !selectedDB || !selectedTable) return;
    pendingRef.current = 'data';
    dispatch({ type: 'LOAD_DATA_START' });
    fetchData(client, selectedDB, selectedTable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDB, selectedTable, dispatch]);

  const refresh = useCallback(() => {
    if (!client) return;
    if (selectedDB && selectedTable) {
      pendingRef.current = 'data';
      dispatch({ type: 'LOAD_DATA_START' });
      fetchData(client, selectedDB, selectedTable);
    } else if (selectedDB) {
      pendingRef.current = 'tables';
      dispatch({ type: 'LOAD_TABLES_START' });
      fetchTables(client, selectedDB);
    }
  }, [client, selectedDB, selectedTable, dispatch]);

  const clearTable = useCallback(() => {
    if (!client || !selectedDB || !selectedTable) return;
    pendingRef.current = 'clear';
    dispatch({ type: 'LOAD_DATA_START' });
    client.send(EVENTS.SQL_EXECUTE, { dbName: selectedDB, query: `DELETE FROM "${selectedTable}"` });
  }, [client, selectedDB, selectedTable, dispatch]);

  const runCustomQuery = useCallback(
    (sql: string): Promise<{ rows: RowData[]; columns: string[]; error?: string }> =>
      new Promise((resolve) => {
        const db = selectedDBRef.current;
        if (!client || !db) {
          resolve({ rows: [], columns: [], error: 'No database selected' });
          return;
        }
        pendingRef.current = 'query';
        customQueryResolverRef.current = resolve;
        client.send(EVENTS.SQL_EXECUTE, { dbName: db, query: sql });
      }),
    [client],
  );

  return { refresh, clearTable, runCustomQuery };
}
