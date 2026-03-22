import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { C } from '../theme';

export interface DropdownProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
  formatLabel?: (v: string) => string;
  loading?: boolean;
  disabled?: boolean;
  zIndex?: number;
}

export function Dropdown({
  label,
  value,
  options,
  onSelect,
  formatLabel,
  loading,
  disabled,
  zIndex = 10,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const fmt = formatLabel ?? ((v: string) => v);

  return (
    <View style={[s.root, { zIndex }]}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        style={[s.trigger, open && s.triggerOpen, disabled && s.triggerDisabled]}
        onPress={() => !disabled && setOpen((o) => !o)}
      >
        {loading ? <ActivityIndicator size="small" color={C.textSecondary} style={s.spinner} /> : null}
        <Text style={[s.triggerText, !value && s.triggerPlaceholder]} numberOfLines={1}>
          {value ? fmt(value) : '— select —'}
        </Text>
        <Text style={s.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open && (
        <View style={[s.menu, { zIndex: zIndex + 10 }]}>
          <ScrollView style={s.menuScroll} nestedScrollEnabled>
            {options.length === 0 ? (
              <Text style={s.menuEmpty}>No options</Text>
            ) : (
              options.map((opt) => (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [
                    s.menuItem,
                    value === opt && s.menuItemSelected,
                    pressed && s.menuItemPressed,
                  ]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.menuItemText, value === opt && s.menuItemTextSelected]}>
                    {fmt(opt)}
                  </Text>
                  {value === opt && <Text style={s.checkmark}>✓</Text>}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { position: 'relative', minWidth: 180 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 180,
  },
  triggerOpen: { borderColor: C.accent },
  triggerDisabled: { opacity: 0.35 },
  spinner: { marginRight: 6 },
  triggerText: { fontSize: 13, color: C.text, fontWeight: '500', flex: 1 },
  triggerPlaceholder: { color: C.textMuted },
  chevron: { fontSize: 11, color: C.textSecondary, marginLeft: 8 },
  menu: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
  },
  menuScroll: { maxHeight: 200 },
  menuEmpty: { padding: 14, fontSize: 12, color: C.textMuted, textAlign: 'center' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemSelected: { backgroundColor: C.accentSubtle },
  menuItemPressed: { backgroundColor: C.surface },
  menuItemText: { fontSize: 13, color: C.text },
  menuItemTextSelected: { color: C.accent, fontWeight: '600' },
  checkmark: { fontSize: 12, color: C.accent },
});
