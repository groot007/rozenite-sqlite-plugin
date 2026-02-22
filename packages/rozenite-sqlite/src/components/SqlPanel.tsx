import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { C } from '../theme';
import type { RowData } from '../theme';

interface SqlPanelProps {
  selectedDB: string | null;
  runCustomQuery: (sql: string) => Promise<{ rows: RowData[]; columns: string[]; error?: string }>;
}

export function SqlPanel({ selectedDB, runCustomQuery }: SqlPanelProps) {
  const [sql, setSql] = useState('');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{ rows: RowData[]; columns: string[] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handleRun = () => {
    if (!sql.trim() || queryRunning || !selectedDB) return;
    setQueryRunning(true);
    setQueryResult(null);
    setQueryError(null);
    runCustomQuery(sql.trim()).then(
      (result) => {
        setQueryRunning(false);
        if (result.error) {
          setQueryError(result.error);
        } else {
          setQueryResult({ rows: result.rows, columns: result.columns });
        }
      },
      (err: unknown) => {
        setQueryRunning(false);
        setQueryError(err instanceof Error ? err.message : String(err));
      },
    );
  };

  return (
    <View style={s.panel}>
      <View style={s.inputRow}>
        <TextInput
          style={s.sqlInput}
          value={sql}
          onChangeText={setSql}
          placeholder={'SELECT * FROM "table_name"'}
          placeholderTextColor={C.textMuted}
          multiline
          blurOnSubmit={false}
        />
        <View style={s.actions}>
          <Pressable
            style={[s.runBtn, (queryRunning || !sql.trim() || !selectedDB) && s.runBtnDisabled]}
            onPress={handleRun}
            disabled={queryRunning || !sql.trim() || !selectedDB}
          >
            {queryRunning
              ? <ActivityIndicator size="small" color="#0d1117" />
              : <Text style={s.runBtnText}>▶ Run</Text>
            }
          </Pressable>
          {(queryResult !== null || queryError !== null) && (
            <Pressable
              style={s.clearBtn}
              onPress={() => { setQueryResult(null); setQueryError(null); }}
            >
              <Text style={s.clearBtnText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {queryError !== null && (
        <View style={s.errorRow}>
          <Text style={s.errorIcon}>⚠</Text>
          <Text style={s.errorText}>{queryError}</Text>
        </View>
      )}

      {queryResult !== null && (
        <View style={s.resultArea}>
          <Text style={s.resultMeta}>
            {queryResult.rows.length === 0
              ? 'Query executed · 0 rows'
              : `${queryResult.rows.length} row${queryResult.rows.length !== 1 ? 's' : ''} · ${queryResult.columns.length} col${queryResult.columns.length !== 1 ? 's' : ''}`}
          </Text>
          {queryResult.rows.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator style={s.resultScroll}>
              <View>
                <View style={s.miniHeaderRow}>
                  {queryResult.columns.map((col) => (
                    <Text key={col} style={s.miniHeaderCell} numberOfLines={1}>{col}</Text>
                  ))}
                </View>
                {queryResult.rows.slice(0, 200).map((row, i) => (
                  <View key={i} style={[s.miniRow, i % 2 === 0 ? s.miniRowEven : s.miniRowOdd]}>
                    {queryResult.columns.map((col) => {
                      const val = row[col];
                      return (
                        <Text key={col} style={[s.miniCell, val == null && s.miniCellNull]} numberOfLines={1}>
                          {val == null ? 'NULL' : String(val)}
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sqlInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
    fontFamily: 'monospace',
    outlineStyle: 'none' as any,
    minHeight: 64,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  actions: { gap: 6 },
  runBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 7,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    minWidth: 72,
  },
  runBtnDisabled: { opacity: 0.4 },
  runBtnText: { fontSize: 12, fontWeight: '700', color: '#0d1117' },
  clearBtn: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  clearBtnText: { fontSize: 11, color: C.textSecondary },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(248,81,73,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,81,73,0.25)',
    borderRadius: 7,
    padding: 10,
  },
  errorIcon: { fontSize: 13, color: C.danger, marginTop: 1 },
  errorText: { flex: 1, fontSize: 12, color: C.danger, lineHeight: 18, fontFamily: 'monospace' },
  resultArea: { gap: 6 },
  resultMeta: { fontSize: 11, color: C.textMuted },
  resultScroll: { maxHeight: 240, borderRadius: 7, borderWidth: 1, borderColor: C.border },
  miniHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.surface2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  miniHeaderCell: {
    width: 130,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    borderRightWidth: 1,
    borderRightColor: C.borderSubtle,
  },
  miniRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.borderSubtle },
  miniRowEven: { backgroundColor: C.bg },
  miniRowOdd: { backgroundColor: C.surface },
  miniCell: {
    width: 130,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: C.text,
    borderRightWidth: 1,
    borderRightColor: C.borderSubtle,
  },
  miniCellNull: { color: C.textMuted, fontStyle: 'italic' },
});
