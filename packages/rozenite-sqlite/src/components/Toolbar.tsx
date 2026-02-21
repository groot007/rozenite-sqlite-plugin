import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Dropdown } from './Dropdown';

interface ToolbarProps {
  databases: string[];
  selectedDB: string | null;
  tables: string[];
  selectedTable: string | null;
  loadingTables: boolean;
  loadingData: boolean;
  rowCount: number;
  columnCount: number;
  onSelectDB: (db: string) => void;
  onSelectTable: (table: string) => void;
}

export function Toolbar({
  databases,
  selectedDB,
  tables,
  selectedTable,
  loadingTables,
  loadingData,
  rowCount,
  columnCount,
  onSelectDB,
  onSelectTable,
}: ToolbarProps) {
  return (
    <View style={s.toolbar}>
      <View style={s.brand}>
        <Text style={s.brandMark}>⬡</Text>
        <Text style={s.brandName}>SQLite Explorer</Text>
      </View>

      <View style={s.selectors}>
        <Dropdown
          label="Database"
          value={selectedDB}
          options={databases}
          onSelect={onSelectDB}
          loading={loadingTables && !selectedTable}
          zIndex={20}
        />
        <View style={s.divider} />
        <Dropdown
          label="Table"
          value={selectedTable}
          options={tables}
          onSelect={onSelectTable}
          loading={loadingTables}
          disabled={!selectedDB}
          zIndex={10}
        />
      </View>

      <View style={s.badges}>
        {selectedTable && !loadingData && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{rowCount} rows</Text>
          </View>
        )}
        {columnCount > 0 && !loadingData && (
          <View style={[s.badge, s.badgeMuted]}>
            <Text style={s.badgeText}>{columnCount} cols</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 20,
    zIndex: 50,
    overflow: 'visible' as any,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
    marginRight: 4,
  },
  brandMark: { fontSize: 18, color: C.accent },
  brandName: { fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: 0.2 },
  selectors: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    overflow: 'visible' as any,
  },
  divider: { width: 12 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 3 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.accentSubtle,
    borderRadius: 20,
  },
  badgeMuted: { backgroundColor: C.surface2 },
  badgeText: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
});
