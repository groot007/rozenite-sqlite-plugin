import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { EVENTS } from '../../constants';

// Create mock client before importing the hook
const mockSubscriptions: Array<{ remove: ReturnType<typeof vi.fn> }> = [];
const messageHandlers = new Map<string, (payload: unknown) => void>();

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
import { useRozeniteSQLite, type RozeniteSQLiteConfig } from '../../hooks/useRozeniteSQLite';

function simulateMessage(event: string, payload: unknown) {
  const handler = messageHandlers.get(event);
  if (handler) {
    handler(payload);
  }
}

describe('useRozeniteSQLite', () => {
  const defaultConfig: RozeniteSQLiteConfig = {
    databases: ['users.db', 'products.db'],
    sqlExecutor: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    messageHandlers.clear();
    mockSubscriptions.length = 0;
  });

  afterEach(() => {
    cleanup();
  });

  describe('message handler registration', () => {
    it('registers handlers for all events', () => {
      renderHook(() => useRozeniteSQLite(defaultConfig));

      expect(mockClient.onMessage).toHaveBeenCalledWith(EVENTS.GET_DB_LIST, expect.any(Function));
      expect(mockClient.onMessage).toHaveBeenCalledWith(EVENTS.SQL_EXECUTE, expect.any(Function));
      expect(mockClient.onMessage).toHaveBeenCalledWith(EVENTS.SAVE_ROW, expect.any(Function));
      expect(mockClient.onMessage).toHaveBeenCalledWith(EVENTS.DELETE_ROW, expect.any(Function));
      expect(mockClient.onMessage).toHaveBeenCalledWith(EVENTS.CLEAR_TABLE, expect.any(Function));
    });

    it('cleans up subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useRozeniteSQLite(defaultConfig));

      unmount();

      mockSubscriptions.forEach((sub) => {
        expect(sub.remove).toHaveBeenCalled();
      });
    });
  });

  describe('GET_DB_LIST handler', () => {
    it('responds with database list', () => {
      renderHook(() => useRozeniteSQLite(defaultConfig));

      simulateMessage(EVENTS.GET_DB_LIST, undefined);

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SEND_DB_LIST, ['users.db', 'products.db']);
    });

    it('uses current config via ref', () => {
      const { rerender } = renderHook(
        ({ config }) => useRozeniteSQLite(config),
        { initialProps: { config: defaultConfig } }
      );

      // Update the config
      const newConfig: RozeniteSQLiteConfig = {
        databases: ['new.db'],
        sqlExecutor: vi.fn().mockResolvedValue([]),
      };
      rerender({ config: newConfig });

      simulateMessage(EVENTS.GET_DB_LIST, undefined);

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SEND_DB_LIST, ['new.db']);
    });
  });

  describe('SQL_EXECUTE handler', () => {
    it('executes query and sends result on success', async () => {
      const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const sqlExecutor = vi.fn().mockResolvedValue(rows);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SQL_EXECUTE, { dbName: 'test.db', query: 'SELECT * FROM users' });
        await Promise.resolve(); // Wait for async
      });

      expect(sqlExecutor).toHaveBeenCalledWith('test.db', 'SELECT * FROM users');
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXEC_RESULT, rows);
    });

    it('sends error when query fails', async () => {
      const sqlExecutor = vi.fn().mockRejectedValue(new Error('Query failed'));
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SQL_EXECUTE, { dbName: 'test.db', query: 'INVALID SQL' });
        await Promise.resolve();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXEC_RESULT, {
        error: 'Query failed',
      });
    });

    it('handles non-Error rejection', async () => {
      const sqlExecutor = vi.fn().mockRejectedValue('string error');
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SQL_EXECUTE, { dbName: 'test.db', query: 'SELECT 1' });
        await Promise.resolve();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.SQL_EXEC_RESULT, {
        error: 'string error',
      });
    });
  });

  describe('SAVE_ROW handler', () => {
    it('generates UPDATE query with escaped values', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SAVE_ROW, {
          dbName: 'test.db',
          table: 'users',
          row: { id: 1, name: 'Alice', age: 30 },
          primaryKey: 'id',
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith(
        'test.db',
        'UPDATE "users" SET "name" = \'Alice\', "age" = 30 WHERE "id" = 1'
      );
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, { success: true });
    });

    it('escapes single quotes in values', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SAVE_ROW, {
          dbName: 'test.db',
          table: 'users',
          row: { id: 1, name: "O'Brien" },
          primaryKey: 'id',
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith(
        'test.db',
        'UPDATE "users" SET "name" = \'O\'\'Brien\' WHERE "id" = 1'
      );
    });

    it('handles NULL values', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SAVE_ROW, {
          dbName: 'test.db',
          table: 'users',
          row: { id: 1, name: null },
          primaryKey: 'id',
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith(
        'test.db',
        'UPDATE "users" SET "name" = NULL WHERE "id" = 1'
      );
    });

    it('sends error on failure', async () => {
      const sqlExecutor = vi.fn().mockRejectedValue(new Error('Constraint violation'));
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.SAVE_ROW, {
          dbName: 'test.db',
          table: 'users',
          row: { id: 1, name: 'Test' },
          primaryKey: 'id',
        });
        await Promise.resolve();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, {
        success: false,
        error: 'Constraint violation',
      });
    });
  });

  describe('DELETE_ROW handler', () => {
    it('generates DELETE query', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.DELETE_ROW, {
          dbName: 'test.db',
          table: 'users',
          primaryKey: 'id',
          primaryKeyValue: 42,
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith(
        'test.db',
        'DELETE FROM "users" WHERE "id" = 42'
      );
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, { success: true });
    });

    it('handles string primary key values', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.DELETE_ROW, {
          dbName: 'test.db',
          table: 'events',
          primaryKey: 'uuid',
          primaryKeyValue: 'abc-123',
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith(
        'test.db',
        'DELETE FROM "events" WHERE "uuid" = \'abc-123\''
      );
    });

    it('sends error on failure', async () => {
      const sqlExecutor = vi.fn().mockRejectedValue(new Error('FK constraint'));
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.DELETE_ROW, {
          dbName: 'test.db',
          table: 'users',
          primaryKey: 'id',
          primaryKeyValue: 1,
        });
        await Promise.resolve();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, {
        success: false,
        error: 'FK constraint',
      });
    });
  });

  describe('CLEAR_TABLE handler', () => {
    it('generates DELETE query without WHERE clause', async () => {
      const sqlExecutor = vi.fn().mockResolvedValue([]);
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.CLEAR_TABLE, {
          dbName: 'test.db',
          table: 'logs',
        });
        await Promise.resolve();
      });

      expect(sqlExecutor).toHaveBeenCalledWith('test.db', 'DELETE FROM "logs"');
      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, { success: true });
    });

    it('sends error on failure', async () => {
      const sqlExecutor = vi.fn().mockRejectedValue(new Error('Failed'));
      const config: RozeniteSQLiteConfig = {
        databases: ['test.db'],
        sqlExecutor,
      };

      renderHook(() => useRozeniteSQLite(config));

      await act(async () => {
        simulateMessage(EVENTS.CLEAR_TABLE, {
          dbName: 'test.db',
          table: 'logs',
        });
        await Promise.resolve();
      });

      expect(mockClient.send).toHaveBeenCalledWith(EVENTS.MUTATION_RESULT, {
        success: false,
        error: 'Failed',
      });
    });
  });
});
