import { describe, it, expect } from 'vitest';
import { reducer, initialState, type ExplorerState, type Action } from '../../hooks/useExplorerState';

describe('useExplorerState reducer', () => {
  describe('RESET', () => {
    it('returns initial state', () => {
      const state: ExplorerState = {
        ...initialState,
        databases: ['test.db'],
        selectedDB: 'test.db',
        rows: [{ id: 1 }],
        status: 'idle',
      };

      const result = reducer(state, { type: 'RESET' });

      expect(result).toEqual(initialState);
    });
  });

  describe('SELECT_DB', () => {
    it('sets selectedDB and clears related state', () => {
      const state: ExplorerState = {
        ...initialState,
        databases: ['db1.db', 'db2.db'],
        selectedDB: 'db1.db',
        tables: ['users', 'products'],
        selectedTable: 'users',
        rows: [{ id: 1 }],
        columns: ['id', 'name'],
        selectedRowIndex: 0,
        error: 'old error',
      };

      const result = reducer(state, { type: 'SELECT_DB', db: 'db2.db' });

      expect(result.selectedDB).toBe('db2.db');
      expect(result.tables).toEqual([]);
      expect(result.selectedTable).toBeNull();
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.selectedRowIndex).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('SELECT_TABLE', () => {
    it('sets selectedTable and clears selectedRowIndex', () => {
      const state: ExplorerState = {
        ...initialState,
        selectedTable: 'users',
        selectedRowIndex: 2,
        error: 'old error',
      };

      const result = reducer(state, { type: 'SELECT_TABLE', table: 'products' });

      expect(result.selectedTable).toBe('products');
      expect(result.selectedRowIndex).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('SET_DATABASES', () => {
    it('sets databases and auto-selects first one', () => {
      const state: ExplorerState = { ...initialState, status: 'connecting' };

      const result = reducer(state, {
        type: 'SET_DATABASES',
        databases: ['users.db', 'products.db'],
      });

      expect(result.databases).toEqual(['users.db', 'products.db']);
      expect(result.selectedDB).toBe('users.db');
      expect(result.status).toBe('idle');
      expect(result.error).toBeNull();
    });

    it('sets selectedDB to null when databases is empty', () => {
      const result = reducer(initialState, {
        type: 'SET_DATABASES',
        databases: [],
      });

      expect(result.databases).toEqual([]);
      expect(result.selectedDB).toBeNull();
    });
  });

  describe('LOAD_TABLES_START', () => {
    it('sets status to loadingTables and clears data', () => {
      const state: ExplorerState = {
        ...initialState,
        status: 'idle',
        tables: ['users'],
        selectedTable: 'users',
        rows: [{ id: 1 }],
        columns: ['id'],
        error: 'old error',
      };

      const result = reducer(state, { type: 'LOAD_TABLES_START' });

      expect(result.status).toBe('loadingTables');
      expect(result.tables).toEqual([]);
      expect(result.selectedTable).toBeNull();
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('SET_TABLES', () => {
    it('sets tables and auto-selects first when previous selection invalid', () => {
      const state: ExplorerState = {
        ...initialState,
        status: 'loadingTables',
        selectedTable: 'old_table',
      };

      const result = reducer(state, {
        type: 'SET_TABLES',
        tables: ['users', 'products'],
      });

      expect(result.tables).toEqual(['users', 'products']);
      expect(result.selectedTable).toBe('users');
      expect(result.status).toBe('idle');
    });

    it('preserves selectedTable when it exists in new tables', () => {
      const state: ExplorerState = {
        ...initialState,
        status: 'loadingTables',
        selectedTable: 'products',
      };

      const result = reducer(state, {
        type: 'SET_TABLES',
        tables: ['users', 'products', 'orders'],
      });

      expect(result.selectedTable).toBe('products');
    });

    it('sets selectedTable to null when tables is empty', () => {
      const result = reducer(initialState, {
        type: 'SET_TABLES',
        tables: [],
      });

      expect(result.selectedTable).toBeNull();
    });
  });

  describe('LOAD_DATA_START', () => {
    it('sets status to loadingData and clears row data', () => {
      const state: ExplorerState = {
        ...initialState,
        status: 'idle',
        rows: [{ id: 1 }, { id: 2 }],
        columns: ['id', 'name'],
        selectedRowIndex: 1,
        error: 'old error',
      };

      const result = reducer(state, { type: 'LOAD_DATA_START' });

      expect(result.status).toBe('loadingData');
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.selectedRowIndex).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('SET_DATA', () => {
    it('sets rows and columns', () => {
      const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const columns = ['id', 'name'];

      const result = reducer(
        { ...initialState, status: 'loadingData' },
        { type: 'SET_DATA', rows, columns }
      );

      expect(result.rows).toEqual(rows);
      expect(result.columns).toEqual(columns);
      expect(result.status).toBe('idle');
      expect(result.selectedRowIndex).toBeNull();
    });
  });

  describe('SET_ERROR', () => {
    it('sets error and status', () => {
      const result = reducer(
        { ...initialState, status: 'loadingData' },
        { type: 'SET_ERROR', error: 'Query failed' }
      );

      expect(result.error).toBe('Query failed');
      expect(result.status).toBe('error');
    });
  });

  describe('SELECT_ROW', () => {
    it('selects row by index', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
        selectedRowIndex: null,
      };

      const result = reducer(state, { type: 'SELECT_ROW', index: 1 });

      expect(result.selectedRowIndex).toBe(1);
    });

    it('deselects when selecting same row', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [{ id: 1 }, { id: 2 }],
        selectedRowIndex: 1,
      };

      const result = reducer(state, { type: 'SELECT_ROW', index: 1 });

      expect(result.selectedRowIndex).toBeNull();
    });

    it('changes selection to different row', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
        selectedRowIndex: 0,
      };

      const result = reducer(state, { type: 'SELECT_ROW', index: 2 });

      expect(result.selectedRowIndex).toBe(2);
    });
  });

  describe('CLOSE_ROW', () => {
    it('clears selectedRowIndex', () => {
      const state: ExplorerState = {
        ...initialState,
        selectedRowIndex: 2,
      };

      const result = reducer(state, { type: 'CLOSE_ROW' });

      expect(result.selectedRowIndex).toBeNull();
    });
  });

  describe('SAVE_ROW', () => {
    it('updates row at selected index', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ],
        selectedRowIndex: 1,
      };

      const updated = { id: 2, name: 'Robert' };
      const result = reducer(state, { type: 'SAVE_ROW', updated });

      expect(result.rows[1]).toEqual(updated);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.rows[2]).toEqual({ id: 3, name: 'Charlie' });
    });

    it('returns unchanged state when no row selected', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [{ id: 1, name: 'Alice' }],
        selectedRowIndex: null,
      };

      const result = reducer(state, { type: 'SAVE_ROW', updated: { id: 1, name: 'Bob' } });

      expect(result).toBe(state);
    });
  });

  describe('DELETE_ROW', () => {
    it('removes row at selected index', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
        ],
        selectedRowIndex: 1,
      };

      const result = reducer(state, { type: 'DELETE_ROW' });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ id: 1, name: 'Alice' });
      expect(result.rows[1]).toEqual({ id: 3, name: 'Charlie' });
      expect(result.selectedRowIndex).toBeNull();
    });

    it('returns unchanged state when no row selected', () => {
      const state: ExplorerState = {
        ...initialState,
        rows: [{ id: 1 }],
        selectedRowIndex: null,
      };

      const result = reducer(state, { type: 'DELETE_ROW' });

      expect(result).toBe(state);
    });
  });
});
