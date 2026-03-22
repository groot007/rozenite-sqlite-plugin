import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { C } from '../theme';

export interface PlaceholderProps {
  emoji?: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  buttonText?: string;
  onButtonPress?: () => void;
}

export function Placeholder({
  emoji,
  title,
  subtitle,
  loading,
  buttonText,
  onButtonPress,
}: PlaceholderProps) {
  return (
    <View style={s.container}>
      {loading ? (
        <ActivityIndicator size="large" color={C.accent} />
      ) : emoji ? (
        <Text style={s.emoji}>{emoji}</Text>
      ) : null}
      {title && <Text style={s.title}>{title}</Text>}
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {buttonText && onButtonPress && (
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
          onPress={onButtonPress}
        >
          <Text style={s.buttonText}>{buttonText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSecondary,
    marginBottom: 6,
    marginTop: 14,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.accent,
    borderRadius: 6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
