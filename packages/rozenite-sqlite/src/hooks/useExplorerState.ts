import { useReducer, useEffect, useCallback } from 'react';
import { useRozeniteDevToolsClient } from '@rozenite/plugin-bridge';
import type { RowData } from '../theme';
import { MOCK_DBS, MOCK_TABLES, MOCK_ROWS } from '../mockData';

// ── State shape ───────────────────────────────────────────────────────────────

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
  usingMockData: boolean;
}

// ── Actions ───────────────────────────────────────────────────────────────────

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

// ── Initial state ─────────────────────────────────────────────────────────────

const initial: ExplorerState = {
  databases: MOCK_DBS,
  selectedDB: MOCK_DBS[0],
  tables: MOCK_TABLES[MOCK_DBS[0]],
  selectedTable: MOCK_TABLES[MOCK_DBS[0]][0],
  rows: [],
  columns: [],
  selectedRowIndex: null,
  queryMode: null,
  loadingTables: false,
  loadingData: false,
  usingMockData: true,
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: ExplorerState, action: Action): ExplorerState {
  switch (action.type) {
    case 'SELECT_DB':
      return { ...state, selectedDB: action.db, selectedRowIndex: null };

    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.table, selectedRowIndex: null };

    case 'SET_DATABASES':
      return {
        ...state,
        usingMockData: false,
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
      // Preserve the current selection if it still exists in the new list
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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExplorerState() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { usingMockData, selectedDB, selectedTable, queryMode } = state;

  const client = useRozeniteDevToolsClient({ pluginId: 'rozenite-sqlite' });

  // ── Mock: tables ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!usingMockData || !selectedDB) return;
    dispatch({ type: 'SET_TABLES', tables: MOCK_TABLES[selectedDB] ?? [] });
  }, [usingMockData, selectedDB]);

  // ── Mock: data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!usingMockData) return;
    if (selectedDB && selectedTable) {
      const data = MOCK_ROWS[`${selectedDB}|${selectedTable}`] ?? [];
      dispatch({
        type: 'SET_DATA',
        rows: data,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
      });
    } else {
      dispatch({ type: 'SET_DATA', rows: [], columns: [] });
    }
  }, [usingMockData, selectedDB, selectedTable]);

  // ── Real client: setup + message handlers ─────────────────────────────
  useEffect(() => {
    if (!client) return;
    client.send('get-db-list', undefined);

    client.onMessage('send-db-list', (dbList: string[]) => {
      dispatch({ type: 'SET_DATABASES', databases: dbList });
    });

    client.onMessage('sql-exec-result', (result: any) => {
      if (queryMode === 'tables') {
        const tables = Array.isArray(result) ? result.map((r: any) => r.name) : [];
        dispatch({ type: 'SET_TABLES', tables });
      } else if (queryMode === 'data') {
        const rows: RowData[] = Array.isArray(result) ? result : [];
        dispatch({ type: 'SET_DATA', rows, columns: rows.length > 0 ? Object.keys(rows[0]) : [] });
      }
    });
  }, [client, queryMode]);

  // ── Real client: fetch tables on DB change ────────────────────────────
  useEffect(() => {
    if (!client || usingMockData || !selectedDB) return;
    dispatch({ type: 'LOAD_TABLES_START' });
    client.send('sql-execute', {
      dbName: selectedDB,
      query: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    });
  }, [client, usingMockData, selectedDB]);

  // ── Real client: fetch data on table change ───────────────────────────
  useEffect(() => {
    if (!client || usingMockData || !selectedDB || !selectedTable) return;
    dispatch({ type: 'LOAD_DATA_START' });
    client.send('sql-execute', { dbName: selectedDB, query: `SELECT * FROM ${selectedTable}` });
  }, [client, usingMockData, selectedDB, selectedTable]);

  // ── Stable action callbacks ───────────────────────────────────────────
  const selectDB = useCallback((db: string) => dispatch({ type: 'SELECT_DB', db }), []);
  const selectTable = useCallback((table: string) => dispatch({ type: 'SELECT_TABLE', table }), []);
  const selectRow = useCallback((index: number) => dispatch({ type: 'SELECT_ROW', index }), []);
  const closeRow = useCallback(() => dispatch({ type: 'CLOSE_ROW' }), []);
  const saveRow = useCallback((updated: RowData) => dispatch({ type: 'SAVE_ROW', updated }), []);
  const deleteRow = useCallback(() => dispatch({ type: 'DELETE_ROW' }), []);

  return { state, selectDB, selectTable, selectRow, closeRow, saveRow, deleteRow };
}
