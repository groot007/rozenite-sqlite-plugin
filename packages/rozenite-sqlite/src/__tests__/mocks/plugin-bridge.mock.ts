import { vi } from 'vitest';

export type MessageHandler = (payload: unknown) => void;

export interface MockSubscription {
  remove: ReturnType<typeof vi.fn>;
}

export interface MockClient {
  send: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn<[string, MessageHandler], MockSubscription>>;
  _handlers: Map<string, MessageHandler>;
  _simulateMessage: (event: string, payload: unknown) => void;
}

/**
 * Creates a mock client for @rozenite/plugin-bridge
 * Use _simulateMessage to trigger message handlers in tests
 */
export function createMockClient(): MockClient {
  const handlers = new Map<string, MessageHandler>();

  const mockClient: MockClient = {
    send: vi.fn(),
    onMessage: vi.fn((event: string, handler: MessageHandler) => {
      handlers.set(event, handler);
      return { remove: vi.fn(() => handlers.delete(event)) };
    }),
    _handlers: handlers,
    _simulateMessage: (event: string, payload: unknown) => {
      const handler = handlers.get(event);
      if (handler) {
        handler(payload);
      }
    },
  };

  return mockClient;
}

// Default mock client instance for simple tests
export const mockClient = createMockClient();

// Mock the plugin-bridge module
export const mockUseRozeniteDevToolsClient = vi.fn(() => mockClient);

vi.mock('@rozenite/plugin-bridge', () => ({
  useRozeniteDevToolsClient: mockUseRozeniteDevToolsClient,
}));
