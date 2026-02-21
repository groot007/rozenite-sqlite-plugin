import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { C, type RowData } from '../theme';

function isJsonString(val: string): boolean {
  const t = val.trim();
  if (t.length < 2 || (t[0] !== '{' && t[0] !== '[')) return false;
  try { JSON.parse(t); return true; } catch { return false; }
}

export interface RowDetailPanelProps {
  row: RowData | null;
  rowIndex: number | null;
  onClose: () => void;
  onSave: (updated: RowData) => void;
  onDelete: () => void;
}

export function RowDetailPanel({ row, rowIndex, onClose, onSave, onDelete }: RowDetailPanelProps) {
  const [draft, setDraft] = useState<RowData>({});
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (row) {
      const formatted = Object.fromEntries(
        Object.entries(row).map(([k, v]) => {
          const s = v == null ? v : String(v);
          if (s != null && isJsonString(s)) {
            try { return [k, JSON.stringify(JSON.parse(s), null, 2)]; } catch {}
          }
          return [k, v];
        })
      );
      setDraft(formatted);
      setDirty(false);
      setConfirmDelete(false);
    }
  }, [row]);

  if (!row) return null;

  const handleChange = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(draft);
    setDirty(false);
  };

  const handleCancel = () => {
    setDraft({ ...row });
    setDirty(false);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <View style={s.panel}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>ROW DETAIL</Text>
          <View style={s.titleRow}>
            <Text style={s.title}>Row #{(rowIndex ?? 0) + 1}</Text>
            {dirty && <View style={s.dirtyDot} />}
          </View>
        </View>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={s.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {Object.entries(draft).map(([key, value]) => {
          const strVal = value === null || value === undefined ? '' : String(value);
          const isJson = isJsonString(strVal);
          return (
            <View key={key} style={s.field}>
              <View style={s.fieldKeyRow}>
                <Text style={s.fieldKey}>{key}</Text>
                {isJson && <Text style={s.fieldJsonBadge}>JSON</Text>}
              </View>
              <TextInput
                style={[s.fieldInput, isJson && s.fieldInputJson]}
                value={strVal}
                onChangeText={(text) => handleChange(key, text)}
                placeholder="NULL"
                placeholderTextColor={C.textMuted}
                multiline={isJson || strVal.length > 50}
              />
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.primaryActions}>
        <Pressable
          style={({ pressed }) => [s.btn, s.btnSave, !dirty && s.btnSaveDisabled, pressed && !dirty ? {} : pressed && s.btnPressed]}
          onPress={dirty ? handleSave : undefined}
        >
          <Text style={[s.btnSaveText, !dirty && s.btnSaveTextDisabled]}>Save</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btn, s.btnCancel, pressed && s.btnPressed]}
          onPress={handleCancel}
        >
          <Text style={s.btnCancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={s.deleteZone}>
        {!confirmDelete ? (
          <Pressable
            style={({ pressed }) => [s.btnDeleteSmall, pressed && s.btnPressed]}
            onPress={() => setConfirmDelete(true)}
          >
            <Text style={s.btnDeleteSmallText}>⊘  Delete this row</Text>
          </Pressable>
        ) : (
          <View style={s.confirmBox}>
            <Text style={s.confirmLabel}>This action cannot be undone.</Text>
            <View style={s.confirmRow}>
              <Pressable
                style={({ pressed }) => [s.btn, s.btnConfirm, { flex: 1 }, pressed && s.btnPressed]}
                onPress={onDelete}
              >
                <Text style={s.btnConfirmText}>Yes, delete</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.btn, s.btnCancelSmall, { flex: 1 }, pressed && s.btnPressed]}
                onPress={() => setConfirmDelete(false)}
              >
                <Text style={s.btnCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    width: 300,
    backgroundColor: C.surface,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    boxShadow: '-8px 0 24px rgba(0,0,0,0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  dirtyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: C.textSecondary },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  field: { marginBottom: 16 },
  fieldKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  fieldKey: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  fieldJsonBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  fieldInput: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: C.text,
    outlineStyle: 'none' as any,
  },
  fieldInputJson: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    borderColor: 'rgba(167,139,250,0.3)',
    minHeight: 180,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  deleteZone: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  btn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.72 },
  btnSave: { backgroundColor: C.accent },
  btnSaveDisabled: { backgroundColor: C.surface2 },
  btnSaveText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  btnSaveTextDisabled: { color: C.textMuted },
  btnCancel: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  btnCancelText: { fontSize: 13, fontWeight: '500', color: C.textSecondary },
  btnDeleteSmall: {
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnDeleteSmallText: { fontSize: 12, color: C.danger, fontWeight: '500' },
  confirmBox: { gap: 8 },
  confirmLabel: { fontSize: 11, color: C.textMuted, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 8 },
  btnConfirm: { backgroundColor: C.danger },
  btnConfirmText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnCancelSmall: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
});
