import 'react-native';

declare module 'react-native' {
  // Truly web-only CSS properties not present in React Native's type definitions
  interface ViewStyle {
    scrollbarWidth?: string;
    scrollbarColor?: string;
    boxShadow?: string;
  }
  interface ViewProps {
    onMouseDown?: (event: any) => void;
  }
}
