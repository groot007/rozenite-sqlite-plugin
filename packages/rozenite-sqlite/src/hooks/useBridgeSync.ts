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
  const pendingRef = useRef<'tables' | 'data' | null>(null);

  useEffect(() => {
    if (!client) return;
    client.send(EVENTS.GET_DB_LIST, true);

    const sub1 = client.onMessage(EVENTS.SEND_DB_LIST, (payload: unknown) => {
      const databases = Array.isArray(payload) ? (payload as string[]) : [];
      dispatch({ type: 'SET_DATABASES', databases });
    });

    const sub2 = client.onMessage(EVENTS.SQL_EXEC_RESULT, (payload: unknown) => {
      if (payload !== null && typeof payload === 'object' && 'error' in payload) {
        dispatch({ type: 'SET_ERROR', error: String((payload as { error: unknown }).error) });
        return;
      }

      const mode = pendingRef.current;
      if (mode === 'tables') {
        const tables = Array.isArray(payload)
          ? (payload as Array<{ name: string }>).map((r) => r.name)
          : [];
        dispatch({ type: 'SET_TABLES', tables });
      } else if (mode === 'data') {
        const rows: RowData[] = Array.isArray(payload) ? (payload as RowData[]) : [];
        dispatch({ type: 'SET_DATA', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [client, dispatch]);

  useEffect(() => {
    if (!client || !selectedDB) return;
    pendingRef.current = 'tables';
    dispatch({ type: 'LOAD_TABLES_START' });
    fetchTables(client, selectedDB);
  }, [client, selectedDB, dispatch]);

  useEffect(() => {
    if (!client || !selectedDB || !selectedTable) return;
    pendingRef.current = 'data';
    dispatch({ type: 'LOAD_DATA_START' });
    fetchData(client, selectedDB, selectedTable);
  }, [client, selectedDB, selectedTable, dispatch]);

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

  return { refresh };
}
