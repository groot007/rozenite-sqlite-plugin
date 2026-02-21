import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalRows: number;
  columnCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearTable?: () => void;
}

const PAGE_SIZES = [10, 25, 50, 100];
const MAX_PAGE_BUTTONS = 5;

export default function Pagination({
  page,
  pageSize,
  totalFiltered,
  totalRows,
  columnCount,
  onPageChange,
  onPageSizeChange,
  onClearTable,
}: PaginationProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const from = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalFiltered);

  const half = Math.floor(MAX_PAGE_BUTTONS / 2);
  let startPage = Math.max(1, page - half);
  let endPage = startPage + MAX_PAGE_BUTTONS - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
  }
  const pageButtons: number[] = [];
  for (let i = startPage; i <= endPage; i++) pageButtons.push(i);

  const filterActive = totalFiltered !== totalRows;

  return (
    <View style={s.bar}>
      <View style={s.left}>
        {onClearTable && !confirmClear && (
          <Pressable style={s.clearBtn} onPress={() => setConfirmClear(true)}>
            <Text style={s.clearBtnText}>⊘ Clear table</Text>
          </Pressable>
        )}
        {onClearTable && confirmClear && (
          <View style={s.confirmRow}>
            <Text style={s.confirmLabel}>Delete all rows?</Text>
            <Pressable
              style={s.confirmYes}
              onPress={() => { setConfirmClear(false); onClearTable(); }}
            >
              <Text style={s.confirmYesText}>Yes, clear</Text>
            </Pressable>
            <Pressable style={s.confirmNo} onPress={() => setConfirmClear(false)}>
              <Text style={s.confirmNoText}>Cancel</Text>
            </Pressable>
          </View>
        )}
        <Text style={s.info}>
          {totalFiltered === 0
            ? 'No rows'
            : `${from}–${to} of ${totalFiltered}${filterActive ? ` (filtered from ${totalRows})` : ''} rows · ${columnCount} col${columnCount !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={s.controls}>
        <NavBtn label="«" disabled={page <= 1} onPress={() => onPageChange(1)} />
        <NavBtn label="‹" disabled={page <= 1} onPress={() => onPageChange(page - 1)} />

        {startPage > 1 && (
          <>
            <PageBtn num={1} active={false} onPress={() => onPageChange(1)} />
            {startPage > 2 && <Text style={s.ellipsis}>…</Text>}
          </>
        )}

        {pageButtons.map((n) => (
          <PageBtn key={n} num={n} active={n === page} onPress={() => onPageChange(n)} />
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text style={s.ellipsis}>…</Text>}
            <PageBtn num={totalPages} active={false} onPress={() => onPageChange(totalPages)} />
          </>
        )}

        <NavBtn label="›" disabled={page >= totalPages} onPress={() => onPageChange(page + 1)} />
        <NavBtn label="»" disabled={page >= totalPages} onPress={() => onPageChange(totalPages)} />
      </View>

      <View style={s.sizeRow}>
        {PAGE_SIZES.map((sz) => (
          <Pressable
            key={sz}
            onPress={() => onPageSizeChange(sz)}
            style={[s.sizeBtn, sz === pageSize && s.sizeBtnActive]}
          >
            <Text style={[s.sizeBtnText, sz === pageSize && s.sizeBtnTextActive]}>{sz}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function PageBtn({ num, active, onPress }: { num: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.pageBtn, active && s.pageBtnActive]}>
      <Text style={[s.pageBtnText, active && s.pageBtnTextActive]}>{num}</Text>
    </Pressable>
  );
}

function NavBtn({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[s.navBtn, disabled && s.navBtnDisabled]}>
      <Text style={[s.navBtnText, disabled && s.navBtnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
    flexShrink: 1,
  },
  info: {
    color: C.textMuted,
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  clearBtnText: { fontSize: 12, color: C.danger, fontWeight: '500' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmLabel: { fontSize: 11, color: C.textMuted },
  confirmYes: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: C.danger,
    cursor: 'pointer',
  },
  confirmYesText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  confirmNo: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    cursor: 'pointer',
  },
  confirmNoText: { fontSize: 11, color: C.textSecondary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ellipsis: {
    color: C.textMuted,
    fontSize: 13,
    paddingHorizontal: 4,
    lineHeight: 28,
  },
  pageBtn: {
    minWidth: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  pageBtnActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  pageBtnText: {
    color: C.text,
    fontSize: 12,
  },
  pageBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 18,
  },
  navBtnTextDisabled: {
    color: C.textMuted,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  sizeBtn: {
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  sizeBtnActive: {
    backgroundColor: C.surface2,
    borderColor: C.accent,
  },
  sizeBtnText: {
    color: C.textMuted,
    fontSize: 11,
  },
  sizeBtnTextActive: {
    color: C.accent,
    fontWeight: '600',
  },
});
