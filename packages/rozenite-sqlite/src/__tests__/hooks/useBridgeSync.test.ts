import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { EVENTS, QUERIES } from '../../constants';
import type { Action } from '../../hooks/useExplorerState';

// Create mock client before importing the hook
const messageHandlers = new Map<string, (payload: unknown) => void>();
const mockSubscriptions: Array<{ remove: ReturnType<typeof vi.fn> }> = [];

const mockClient = {
  send: vi.fn(),
  onMessage: vi.fn((event: string, handler: (payload: unknown) => void) => {
    messageHandlers.set(event, handler);
    const sub = { remove: vi.fn(() => messageHandlers.delete(event)) };
    mockSubscriptions.push(sub);
    return sub;
  }),
};

vi.mock('@rozenite/plugin-bridge', () => ({
  useRozeniteDevToolsClient: vi.fn(() => mockClient),
}));

// Import after mock is set up
import { useBridgeSync } from '../../hooks/useBridgeSync';

function simulateMessage(event: string, payload: unknown) {
  const handler = messageHandlers.get(event);
  if (handler) {
    handler(payload);
  }
}

describe('useBridgeSync', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    messageHandlers.clear();
    mockSubscriptions.length = 0;
  });

  afterEach(() => {
    cleanup();
  });

  describe('initial connection', () => {
    it('sends GET_DB_LIST and dispatches RESET on mount', () => {
      renderHook(() => useBridgeSync(mockDispatch, null, null));

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.GET_DB_LIST, true);
    });

    it('registers message handlers', () => {
      renderHook(() => useBridgeSync(mockDispatch, null, null));

      expect(messageHandlers.has(EVENTS.SEND_DB_LIST)).toBe(true);
      expect(messageHandlers.has(EVENTS.SQL_EXEC_RESULT)).toBe(true);
      expect(messageHandlers.has(EVENTS.MUTATION_RESULT)).toBe(true);
    });

    it('cleans up handlers on unmount', () => {
      const { unmount } = renderHook(() => useBridgeSync(mockDispatch, null, null));

      unmount();

      mockSubscriptions.forEach((sub) => {
        expect(sub.remove).toHaveBeenCalled();
      });
    });
  });

  describe('SEND_DB_LIST handler', () => {
    it('dispatches SET_DATABASES with database list', () => {
      renderHook(() => useBridgeSync(mockDispatch, null, null));

      simulateMessage(EVENTS.SEND_DB_LIST, ['users.db', 'products.db']);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DATABASES',
        databases: ['users.db', 'products.db'],
      });
    });

    it('handles non-array payload gracefully', () => {
      renderHook(() => useBridgeSync(mockDispatch, null, null));

      simulateMessage(EVENTS.SEND_DB_LIST, null);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DATABASES',
        databases: [],
      });
    });
  });

  describe('database selection cascade', () => {
    it('fetches tables when selectedDB changes', () => {
      const { rerender } = renderHook(
        ({ selectedDB }) => useBridgeSync(mockDispatch, selectedDB, null),
        { initialProps: { selectedDB: null as string | null } }
      );

      mockClient.send.mockClear();
      mockDispatch.mockClear();

      rerender({ selectedDB: 'users.db' });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_TABLES_START' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, {
        dbName: 'users.db',
        query: QUERIES.LIST_TABLES,
      });
    });
  });

  describe('table selection cascade', () => {
    it('fetches data when selectedTable changes', () => {
      const { rerender } = renderHook(
        ({ selectedDB, selectedTable }) => useBridgeSync(mockDispatch, selectedDB, selectedTable),
        { initialProps: { selectedDB: 'users.db', selectedTable: null as string | null } }
      );

      mockClient.send.mockClear();
      mockDispatch.mockClear();

      rerender({ selectedDB: 'users.db', selectedTable: 'users' });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_DATA_START' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, {
        dbName: 'users.db',
        query: 'SELECT * FROM "users"',
      });
    });
  });

  describe('SQL_EXEC_RESULT handler', () => {
    it('dispatches SET_TABLES when pending is tables', () => {
      const { rerender } = renderHook(
        ({ selectedDB }) => useBridgeSync(mockDispatch, selectedDB, null),
        { initialProps: { selectedDB: null as string | null } }
      );

      // Trigger table fetch
      rerender({ selectedDB: 'users.db' });
      mockDispatch.mockClear();

      // Simulate response
      simulateMessage(EVENTS.SQL_EXEC_RESULT, [{ name: 'users' }, { name: 'products' }]);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_TABLES',
        tables: ['users', 'products'],
      });
    });

    it('dispatches SET_DATA when pending is data', () => {
      const { rerender } = renderHook(
        ({ selectedDB, selectedTable }) => useBridgeSync(mockDispatch, selectedDB, selectedTable),
        { initialProps: { selectedDB: 'users.db', selectedTable: null as string | null } }
      );

      // Trigger data fetch
      rerender({ selectedDB: 'users.db', selectedTable: 'users' });
      mockDispatch.mockClear();

      // Simulate response
      const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      simulateMessage(EVENTS.SQL_EXEC_RESULT, rows);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_DATA',
        rows,
        columns: ['id', 'name'],
      });
    });

    it('dispatches SET_ERROR on error response', () => {
      const { rerender } = renderHook(
        ({ selectedDB }) => useBridgeSync(mockDispatch, selectedDB, null),
        { initialProps: { selectedDB: null as string | null } }
      );

      // Trigger table fetch
      rerender({ selectedDB: 'users.db' });
      mockDispatch.mockClear();

      // Simulate error
      simulateMessage(EVENTS.SQL_EXEC_RESULT, { error: 'Query failed' });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR',
        error: 'Query failed',
      });
    });

    it('resolves custom query with rows and columns', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let queryPromise: ReturnType<typeof result.current.runCustomQuery>;
      act(() => {
        queryPromise = result.current.runCustomQuery('SELECT * FROM users LIMIT 5');
      });

      // Simulate response
      act(() => {
        simulateMessage(EVENTS.SQL_EXEC_RESULT, [{ id: 1, name: 'Test' }]);
      });

      const queryResult = await queryPromise!;
      expect(queryResult).toEqual({
        rows: [{ id: 1, name: 'Test' }],
        columns: ['id', 'name'],
      });
    });

    it('resolves custom query with error', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let queryPromise: ReturnType<typeof result.current.runCustomQuery>;
      act(() => {
        queryPromise = result.current.runCustomQuery('INVALID SQL');
      });

      act(() => {
        simulateMessage(EVENTS.SQL_EXEC_RESULT, { error: 'Syntax error' });
      });

      const queryResult = await queryPromise!;
      expect(queryResult).toEqual({
        rows: [],
        columns: [],
        error: 'Syntax error',
      });
    });
  });

  describe('saveRowToDB', () => {
    it('sends SAVE_ROW with id as primary key', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let savePromise: ReturnType<typeof result.current.saveRowToDB>;
      act(() => {
        savePromise = result.current.saveRowToDB(
          { id: 1, name: 'Alice', age: 30 },
          ['id', 'name', 'age']
        );
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SAVE_ROW, {
        dbName: 'users.db',
        table: 'users',
        row: { id: 1, name: 'Alice', age: 30 },
        primaryKey: 'id',
      });

      act(() => {
        simulateMessage(EVENTS.MUTATION_RESULT, { success: true });
      });

      const saveResult = await savePromise!;
      expect(saveResult).toEqual({ success: true });
    });

    it('uses first column as primary key when id not present', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'events.db', 'events')
      );

      act(() => {
        result.current.saveRowToDB(
          { uuid: 'abc-123', type: 'click' },
          ['uuid', 'type']
        );
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SAVE_ROW, {
        dbName: 'events.db',
        table: 'events',
        row: { uuid: 'abc-123', type: 'click' },
        primaryKey: 'uuid',
      });
    });

    it('returns error when no database selected', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, null, null)
      );

      let saveResult: Awaited<ReturnType<typeof result.current.saveRowToDB>>;
      await act(async () => {
        saveResult = await result.current.saveRowToDB({ id: 1 }, ['id']);
      });

      expect(saveResult!).toEqual({
        success: false,
        error: 'No database or table selected',
      });
    });

    it('returns error when columns array is empty', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let saveResult: Awaited<ReturnType<typeof result.current.saveRowToDB>>;
      await act(async () => {
        saveResult = await result.current.saveRowToDB({ id: 1 }, []);
      });

      expect(saveResult!).toEqual({
        success: false,
        error: 'Cannot determine primary key',
      });
    });
  });

  describe('deleteRowFromDB', () => {
    it('sends DELETE_ROW with correct payload', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let deletePromise: ReturnType<typeof result.current.deleteRowFromDB>;
      act(() => {
        deletePromise = result.current.deleteRowFromDB(
          { id: 42, name: 'Alice' },
          ['id', 'name']
        );
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.DELETE_ROW, {
        dbName: 'users.db',
        table: 'users',
        primaryKey: 'id',
        primaryKeyValue: 42,
      });

      act(() => {
        simulateMessage(EVENTS.MUTATION_RESULT, { success: true });
      });

      const deleteResult = await deletePromise!;
      expect(deleteResult).toEqual({ success: true });
    });

    it('returns error when no database selected', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, null, null)
      );

      let deleteResult: Awaited<ReturnType<typeof result.current.deleteRowFromDB>>;
      await act(async () => {
        deleteResult = await result.current.deleteRowFromDB({ id: 1 }, ['id']);
      });

      expect(deleteResult!).toEqual({
        success: false,
        error: 'No database or table selected',
      });
    });
  });

  describe('clearTable', () => {
    it('sends CLEAR_TABLE and refreshes data on success', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      mockClient.send.mockClear();

      let clearPromise: ReturnType<typeof result.current.clearTable>;
      act(() => {
        clearPromise = result.current.clearTable();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.CLEAR_TABLE, {
        dbName: 'users.db',
        table: 'users',
      });

      mockDispatch.mockClear();
      mockClient.send.mockClear();

      act(() => {
        simulateMessage(EVENTS.MUTATION_RESULT, { success: true });
      });

      const clearResult = await clearPromise!;
      expect(clearResult).toEqual({ success: true });

      // Should trigger data refresh
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_DATA_START' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, {
        dbName: 'users.db',
        query: 'SELECT * FROM "users"',
      });
    });

    it('does not refresh data on failure', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      let clearPromise: ReturnType<typeof result.current.clearTable>;
      act(() => {
        clearPromise = result.current.clearTable();
      });

      mockDispatch.mockClear();
      mockClient.send.mockClear();

      act(() => {
        simulateMessage(EVENTS.MUTATION_RESULT, { success: false, error: 'Permission denied' });
      });

      const clearResult = await clearPromise!;
      expect(clearResult).toEqual({ success: false, error: 'Permission denied' });

      // Should NOT trigger refresh
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'LOAD_DATA_START' });
    });

    it('returns error when no database selected', async () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, null, null)
      );

      let clearResult: Awaited<ReturnType<typeof result.current.clearTable>>;
      await act(async () => {
        clearResult = await result.current.clearTable();
      });

      expect(clearResult!).toEqual({
        success: false,
        error: 'No database or table selected',
      });
    });
  });

  describe('refresh', () => {
    it('refetches data when both DB and table selected', () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      mockClient.send.mockClear();
      mockDispatch.mockClear();

      act(() => {
        result.current.refresh();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_DATA_START' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, {
        dbName: 'users.db',
        query: 'SELECT * FROM "users"',
      });
    });

    it('refetches tables when only DB selected', () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', null)
      );

      mockClient.send.mockClear();
      mockDispatch.mockClear();

      act(() => {
        result.current.refresh();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_TABLES_START' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, {
        dbName: 'users.db',
        query: QUERIES.LIST_TABLES,
      });
    });
  });

  describe('reconnect', () => {
    it('resets state and requests database list', () => {
      const { result } = renderHook(() =>
        useBridgeSync(mockDispatch, 'users.db', 'users')
      );

      mockClient.send.mockClear();
      mockDispatch.mockClear();

      act(() => {
        result.current.reconnect();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' });
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.GET_DB_LIST, true);
    });
  });
});
