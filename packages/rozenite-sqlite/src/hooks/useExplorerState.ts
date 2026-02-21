import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { RowData } from '../theme';

interface ExplorerState {
  databases: string[];
  selectedDB: string | null;
  tables: string[];
  selectedTable: string | null;
  rows: RowData[];
  columns: string[];
  selectedRowIndex: number | null;
  queryMode: 'tables' | 'data' | null;
  loadingTables: boolean;
  loadingData: boolean;
  connecting: boolean;
}

type Action =
  | { type: 'SELECT_DB'; db: string }
  | { type: 'SELECT_TABLE'; table: string }
  | { type: 'SET_DATABASES'; databases: string[] }
  | { type: 'LOAD_TABLES_START' }
  | { type: 'SET_TABLES'; tables: string[] }
  | { type: 'LOAD_DATA_START' }
  | { type: 'SET_DATA'; rows: RowData[]; columns: string[] }
  | { type: 'SELECT_ROW'; index: number }
  | { type: 'CLOSE_ROW' }
  | { type: 'SAVE_ROW'; updated: RowData }
  | { type: 'DELETE_ROW' };

const initial: ExplorerState = {
  databases: [],
  selectedDB: null,
  tables: [],
  selectedTable: null,
  rows: [],
  columns: [],
  selectedRowIndex: null,
  queryMode: null,
  loadingTables: false,
  loadingData: false,
  connecting: true,
};

function reducer(state: ExplorerState, action: Action): ExplorerState {
  switch (action.type) {
    case 'SELECT_DB':
      return {
        ...state,
        selectedDB: action.db,
        tables: [],
        selectedTable: null,
        rows: [],
        columns: [],
        selectedRowIndex: null,
      };

    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.table, selectedRowIndex: null };

    case 'SET_DATABASES':
      return {
        ...state,
        connecting: false,
        databases: action.databases,
        selectedDB: action.databases[0] ?? null,
      };

    case 'LOAD_TABLES_START':
      return {
        ...state,
        tables: [],
        selectedTable: null,
        rows: [],
        columns: [],
        loadingTables: true,
        queryMode: 'tables',
      };

    case 'SET_TABLES': {
      const { tables } = action;
      const selectedTable = tables.includes(state.selectedTable ?? '')
        ? state.selectedTable
        : (tables[0] ?? null);
      return { ...state, tables, selectedTable, loadingTables: false };
    }

    case 'LOAD_DATA_START':
      return {
        ...state,
        rows: [],
        columns: [],
        selectedRowIndex: null,
        loadingData: true,
        queryMode: 'data',
      };

    case 'SET_DATA':
      return {
        ...state,
        rows: action.rows,
        columns: action.columns,
        loadingData: false,
        selectedRowIndex: null,
      };

    case 'SELECT_ROW':
      return {
        ...state,
        selectedRowIndex: state.selectedRowIndex === action.index ? null : action.index,
      };

    case 'CLOSE_ROW':
      return { ...state, selectedRowIndex: null };

    case 'SAVE_ROW':
      if (state.selectedRowIndex === null) return state;
      return {
        ...state,
        rows: state.rows.map((r, i) => (i === state.selectedRowIndex ? action.updated : r)),
      };

    case 'DELETE_ROW':
      if (state.selectedRowIndex === null) return state;
      return {
        ...state,
        rows: state.rows.filter((_, i) => i !== state.selectedRowIndex),
        selectedRowIndex: null,
      };

    default:
      return state;
  }
}

export function useExplorerState() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { selectedDB, selectedTable } = state;

  const client = useRozeniteDevToolsClient({ pluginId: 'rozenite-sqlite' });

  const pendingRef = useRef<'tables' | 'data' | null>(null);

  useEffect(() => {
    if (!client) return;
    client.send('get-db-list', true);

    const sub1 = client.onMessage('send-db-list', (dbList: string[]) => {
      dispatch({ type: 'SET_DATABASES', databases: dbList });
    });

    const sub2 = client.onMessage('sql-exec-result', (result: any) => {
      const mode = pendingRef.current;
      if (mode === 'tables') {
        const tables = Array.isArray(result) ? result.map((r: any) => r.name) : [];
        dispatch({ type: 'SET_TABLES', tables });
      } else if (mode === 'data') {
        const rows: RowData[] = Array.isArray(result) ? result : [];
        dispatch({ type: 'SET_DATA', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [client]);

  useEffect(() => {
    if (!client || !selectedDB) return;
    pendingRef.current = 'tables';
    dispatch({ type: 'LOAD_TABLES_START' });
    client.send('sql-execute', {
      dbName: selectedDB,
      query: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    });
  }, [client, selectedDB]);

  useEffect(() => {
    if (!client || !selectedDB || !selectedTable) return;
    pendingRef.current = 'data';
    dispatch({ type: 'LOAD_DATA_START' });
    client.send('sql-execute', { dbName: selectedDB, query: `SELECT * FROM "${selectedTable}"` });
  }, [client, selectedDB, selectedTable]);

  const selectDB = useCallback((db: string) => dispatch({ type: 'SELECT_DB', db }), []);
  const selectTable = useCallback((table: string) => dispatch({ type: 'SELECT_TABLE', table }), []);
  const selectRow = useCallback((index: number) => dispatch({ type: 'SELECT_ROW', index }), []);
  const closeRow = useCallback(() => dispatch({ type: 'CLOSE_ROW' }), []);
  const saveRow = useCallback((updated: RowData) => dispatch({ type: 'SAVE_ROW', updated }), []);
  const deleteRow = useCallback(() => dispatch({ type: 'DELETE_ROW' }), []);

  const refresh = useCallback(() => {
    if (!client) return;
    if (selectedDB && selectedTable) {
      pendingRef.current = 'data';
      dispatch({ type: 'LOAD_DATA_START' });
      client.send('sql-execute', { dbName: selectedDB, query: `SELECT * FROM "${selectedTable}"` });
    } else if (selectedDB) {
      pendingRef.current = 'tables';
      dispatch({ type: 'LOAD_TABLES_START' });
      client.send('sql-execute', {
        dbName: selectedDB,
        query: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      });
    }
  }, [client, selectedDB, selectedTable]);

  return { state, selectDB, selectTable, selectRow, closeRow, saveRow, deleteRow, refresh };
}

