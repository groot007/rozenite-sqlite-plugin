import { vi, afterEach } from 'vitest';

// Mock React Native modules that don't work in jsdom
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (styles: Record<string, unknown>) => styles },
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
