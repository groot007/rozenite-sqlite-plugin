import { useReducer, useCallback, useState } from 'react';
import type { RowData } from '../theme';
import { useBridgeSync, type MutationResult } from './useBridgeSync';

export type ExplorerStatus = 'connecting' | 'idle' | 'loadingTables' | 'loadingData' | 'error';

export interface ExplorerState {
  databases: string[];
  selectedDB: string | null;
  tables: string[];
  selectedTable: string | null;
  rows: RowData[];
  columns: string[];
  selectedRowIndex: number | null;
  status: ExplorerStatus;
  error: string | null;
}

export type Action =
  | { type: 'RESET' }
  | { type: 'SELECT_DB'; db: string }
  | { type: 'SELECT_TABLE'; table: string }
  | { type: 'SET_DATABASES'; databases: string[] }
  | { type: 'LOAD_TABLES_START' }
  | { type: 'SET_TABLES'; tables: string[] }
  | { type: 'LOAD_DATA_START' }
  | { type: 'SET_DATA'; rows: RowData[]; columns: string[] }
  | { type: 'SET_ERROR'; error: string }
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
  status: 'connecting',
  error: null,
};

function reducer(state: ExplorerState, action: Action): ExplorerState {
  switch (action.type) {
    case 'RESET':
      return { ...initial };

    case 'SELECT_DB':
      return {
        ...state,
        selectedDB: action.db,
        tables: [],
        selectedTable: null,
        rows: [],
        columns: [],
        selectedRowIndex: null,
        error: null,
      };

    case 'SELECT_TABLE':
      return { ...state, selectedTable: action.table, selectedRowIndex: null, error: null };

    case 'SET_DATABASES':
      return {
        ...state,
        status: 'idle',
        databases: action.databases,
        selectedDB: action.databases[0] ?? null,
        error: null,
      };

    case 'LOAD_TABLES_START':
      return {
        ...state,
        status: 'loadingTables',
        tables: [],
        selectedTable: null,
        rows: [],
        columns: [],
        error: null,
      };

    case 'SET_TABLES': {
      const { tables } = action;
      const selectedTable = tables.includes(state.selectedTable ?? '')
        ? state.selectedTable
        : (tables[0] ?? null);
      return { ...state, status: 'idle', tables, selectedTable };
    }

    case 'LOAD_DATA_START':
      return {
        ...state,
        status: 'loadingData',
        rows: [],
        columns: [],
        selectedRowIndex: null,
        error: null,
      };

    case 'SET_DATA':
      return {
        ...state,
        status: 'idle',
        rows: action.rows,
        columns: action.columns,
        selectedRowIndex: null,
      };

    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.error };

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
  const { selectedDB, selectedTable, columns, selectedRowIndex, rows } = state;
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { refresh, clearTable, runCustomQuery, saveRowToDB, deleteRowFromDB, reconnect } = useBridgeSync(dispatch, selectedDB, selectedTable);

  const selectDB = useCallback((db: string) => dispatch({ type: 'SELECT_DB', db }), []);
  const selectTable = useCallback((table: string) => dispatch({ type: 'SELECT_TABLE', table }), []);
  const selectRow = useCallback((index: number) => dispatch({ type: 'SELECT_ROW', index }), []);
  const closeRow = useCallback(() => dispatch({ type: 'CLOSE_ROW' }), []);

  const saveRow = useCallback(
    async (updated: RowData): Promise<MutationResult> => {
      setMutating(true);
      setMutationError(null);
      const result = await saveRowToDB(updated, columns);
      setMutating(false);
      if (result.success) {
        dispatch({ type: 'SAVE_ROW', updated });
      } else {
        setMutationError(result.error ?? 'Failed to save row');
      }
      return result;
    },
    [saveRowToDB, columns],
  );

  const deleteRow = useCallback(
    async (): Promise<MutationResult> => {
      if (selectedRowIndex === null) {
        return { success: false, error: 'No row selected' };
      }
      const row = rows[selectedRowIndex];
      if (!row) {
        return { success: false, error: 'Row not found' };
      }
      setMutating(true);
      setMutationError(null);
      const result = await deleteRowFromDB(row, columns);
      setMutating(false);
      if (result.success) {
        dispatch({ type: 'DELETE_ROW' });
      } else {
        setMutationError(result.error ?? 'Failed to delete row');
      }
      return result;
    },
    [deleteRowFromDB, columns, selectedRowIndex, rows],
  );

  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    state,
    selectDB,
    selectTable,
    selectRow,
    closeRow,
    saveRow,
    deleteRow,
    refresh,
    clearTable,
    runCustomQuery,
    mutating,
    mutationError,
    clearMutationError,
    reconnect,
  };
}

