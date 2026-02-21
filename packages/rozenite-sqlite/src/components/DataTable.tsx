import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { C, type RowData } from '../theme';
import Pagination from './Pagination';
import type { ExplorerStatus } from '../hooks/useExplorerState';

export interface DataTableProps {
  columns: string[];
  rows: RowData[];
  selectedRowIndex: number | null;
  onRowSelect: (originalIndex: number) => void;
  status: ExplorerStatus;
  error: string | null;
}

const COL_WIDTH = 160;
const IDX_WIDTH = 44;
const HEADER_HEIGHT = 42;

export function DataTable({ columns, rows, selectedRowIndex, onRowSelect, status, error }: DataTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState<Record<string, string>>({});
  const [filterOpenCol, setFilterOpenCol] = useState<string | null>(null);
  const [scrollX, setScrollX] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizeRef = useRef<{ col: string; startX: number; startW: number } | null>(null);
  const colWidthsRef = useRef<Record<string, number>>({});
  useEffect(() => { colWidthsRef.current = colWidths; }, [colWidths]);
  const getColWidth = useCallback((col: string) => colWidths[col] ?? COL_WIDTH, [colWidths]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'rozenite-scrollbar-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = [
      '::-webkit-scrollbar { width: 7px; height: 7px; }',
      '::-webkit-scrollbar-track { background: transparent; }',
      '::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }',
      '::-webkit-scrollbar-thumb:hover { background: #484f58; border: 2px solid transparent; background-clip: content-box; }',
      '::-webkit-scrollbar-corner { background: transparent; }',
    ].join('\n');
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    setSortCol(null);
    setSortDir('asc');
    setSearch({});
    setFilterOpenCol(null);
    setScrollX(0);
    setPage(1);
    setColWidths({});
  }, [columns]);

  useEffect(() => {
    setPage(1);
  }, [search, sortCol, sortDir]);

  const handleSortPress = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev === col) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return col;
    });
  }, []);

  const handleFilterIconPress = useCallback((col: string) => {
    setFilterOpenCol((prev) => (prev === col ? null : col));
  }, []);

  const handleSearchChange = useCallback((col: string, value: string) => {
    setSearch((prev) => ({ ...prev, [col]: value }));
  }, []);

  const handleResizeStart = useCallback((col: string, e: { clientX: number; preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    const startW = colWidthsRef.current[col] ?? COL_WIDTH;
    resizeRef.current = { col, startX: e.clientX, startW };
    if (typeof document === 'undefined') return;
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = ev.clientX - resizeRef.current.startX;
      const newW = Math.max(60, resizeRef.current.startW + delta);
      setColWidths((prev) => ({ ...prev, [resizeRef.current!.col]: newW }));
    };
    const onUp = () => {
      resizeRef.current = null;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const processedRows = useMemo(() => {
    let result = rows.map((row, originalIndex) => ({ row, originalIndex }));

    for (const [col, query] of Object.entries(search)) {
      if (!query.trim()) continue;
      const q = query.toLowerCase();
      result = result.filter(({ row }) => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      });
    }

    if (sortCol) {
      result.sort((a, b) => {
        const av = a.row[sortCol];
        const bv = b.row[sortCol];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, search, sortCol, sortDir]);

  const hasActiveSearch = Object.values(search).some((v) => v.trim().length > 0);

  const pagedRows = useMemo(
    () => processedRows.slice((page - 1) * pageSize, page * pageSize),
    [processedRows, page, pageSize],
  );

  const filterColIdx = filterOpenCol !== null ? columns.indexOf(filterOpenCol) : -1;
  const popoverLeft = filterColIdx >= 0
    ? Math.max(0, columns.slice(0, filterColIdx).reduce((acc, c) => acc + (colWidths[c] ?? COL_WIDTH), IDX_WIDTH) - scrollX)
    : 0;

  if (status === 'connecting') {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>📡</Text>
        <Text style={s.placeholderTitle}>Waiting for app…</Text>
        <Text style={s.placeholderSub}>
          Make sure your app is running and useRozeniteSQLite is initialized
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>⚠️</Text>
        <Text style={s.placeholderTitle}>Query failed</Text>
        <Text style={s.placeholderSub}>{error}</Text>
      </View>
    );
  }

  if (status === 'loadingTables' || status === 'loadingData') {
    return (
      <View style={s.placeholder}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.placeholderText}>Loading…</Text>
      </View>
    );
  }

  if (columns.length === 0) {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>🗄️</Text>
        <Text style={s.placeholderTitle}>No data to display</Text>
        <Text style={s.placeholderSub}>Select a database and table above</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={s.placeholder}>
        <Text style={s.placeholderEmoji}>📭</Text>
        <Text style={s.placeholderTitle}>Table is empty</Text>
        <Text style={s.placeholderSub}>This table has no rows yet</Text>
      </View>
    );
  }

  return (
    <View style={s.outer}>
      <View style={s.headerClip}>
        <View style={[s.headerRow, { transform: [{ translateX: -scrollX }] }]}>
          <View style={[s.cell, { width: IDX_WIDTH }]}>
            <Text style={s.headerText}>#</Text>
          </View>
          {columns.map((col) => {
            const isSortActive = sortCol === col;
            const hasFilter = (search[col] ?? '').trim().length > 0;
            const isFilterOpen = filterOpenCol === col;
            return (
              <View key={col} style={[s.headerCellWrapper, { width: getColWidth(col) }]}>
                <Pressable
                  style={[s.sortBtn, isSortActive && s.sortBtnActive]}
                  onPress={() => handleSortPress(col)}
                >
                  <Text
                    style={[s.headerText, isSortActive && s.headerTextActive]}
                    numberOfLines={1}
                  >
                    {col}
                  </Text>
                  <Text style={[s.sortArrow, isSortActive && s.sortArrowActive]}>
                    {isSortActive ? (sortDir === 'asc' ? ' ▴' : ' ▾') : ' ⇅'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[s.filterBtn, (hasFilter || isFilterOpen) && s.filterBtnActive]}
                  onPress={() => handleFilterIconPress(col)}
                >
                  <Text style={[s.filterBtnText, (hasFilter || isFilterOpen) && s.filterBtnTextActive]}>
                    ⌕
                  </Text>
                </Pressable>
                <View
                  style={s.resizeHandle}
                  onMouseDown={(e: any) => handleResizeStart(col, e)}
                />
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={s.vScroll}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          indicatorStyle="white"
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => setFilterOpenCol(null)}
        >
          <View>
            {processedRows.length === 0 && hasActiveSearch && (
              <View style={s.noResults}>
                <Text style={s.noResultsText}>No rows match the current filters</Text>
              </View>
            )}

            {pagedRows.map(({ row, originalIndex }, visIdx) => (
              <Pressable
                key={originalIndex}
                style={({ pressed }) => [
                  s.row,
                  visIdx % 2 === 0 ? s.rowEven : s.rowOdd,
                  selectedRowIndex === originalIndex && s.rowSelected,
                  pressed && s.rowPressed,
                ]}
                onPress={() => onRowSelect(originalIndex)}
              >
                <View style={[s.cell, { width: IDX_WIDTH }]}>
                  <Text style={s.idxText}>{originalIndex + 1}</Text>
                </View>
                {columns.map((col) => {
                  const val = row[col];
                  const isNull = val == null;
                  const query = (search[col] ?? '').toLowerCase().trim();
                  const display = isNull ? 'NULL' : String(val);
                  const isJsonVal = !isNull && isJsonString(display);
                  return (
                    <View key={col} style={[s.cell, { width: getColWidth(col) }]}>
                      {isJsonVal ? (
                        <View style={s.jsonCell}>
                          <Text style={s.jsonBadge}>{display.trimStart()[0] === '[' ? '[]' : '{}'}</Text>
                          <Text style={s.cellText} numberOfLines={1}>{display}</Text>
                        </View>
                      ) : query && !isNull ? (
                        <HighlightText text={display} query={query} />
                      ) : (
                        <Text style={[s.cellText, isNull && s.cellNull]} numberOfLines={1}>
                          {display}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalFiltered={processedRows.length}
        totalRows={rows.length}
        columnCount={columns.length}
        onPageChange={setPage}
        onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
      />

      {filterOpenCol !== null && filterColIdx >= 0 && (
        <View style={[s.filterPopover, { left: popoverLeft, width: getColWidth(filterOpenCol) }]}>
          <TextInput
            autoFocus
            style={s.filterInput}
            value={search[filterOpenCol] ?? ''}
            onChangeText={(v) => handleSearchChange(filterOpenCol, v)}
            placeholder={`Filter ${filterOpenCol}…`}
            placeholderTextColor={C.textMuted}
          />
          {(search[filterOpenCol] ?? '').length > 0 && (
            <Pressable
              onPress={() => handleSearchChange(filterOpenCol, '')}
              style={s.filterClearBtn}
            >
              <Text style={s.filterClearText}>✕</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function isJsonString(val: string): boolean {
  const t = val.trim();
  if (t.length < 2 || (t[0] !== '{' && t[0] !== '[')) return false;
  try { JSON.parse(t); return true; } catch { return false; }
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) {
    return <Text style={s.cellText} numberOfLines={1}>{text}</Text>;
  }
  return (
    <Text style={s.cellText} numberOfLines={1}>
      {text.slice(0, idx)}
      <Text style={s.cellHighlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, position: 'relative', flexDirection: 'column' },
  headerClip: {
    overflow: 'hidden',
    height: HEADER_HEIGHT,
    backgroundColor: C.surface2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    height: HEADER_HEIGHT,
  },
  vScroll: { flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#30363d transparent' },
  headerCellWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    borderRightWidth: 1,
    borderRightColor: C.borderSubtle,
  },
  sortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    height: HEADER_HEIGHT,
    cursor: 'pointer',
  },
  sortBtnActive: {},
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  headerTextActive: { color: C.accent },
  sortArrow: { fontSize: 14, color: C.textMuted },
  sortArrowActive: { color: C.accent },
  cell: { paddingHorizontal: 12, justifyContent: 'center' },
  filterBtn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    cursor: 'pointer',
  },
  filterBtnActive: { backgroundColor: C.accentSubtle },
  filterBtnText: { fontSize: 24, color: C.textMuted },
  filterBtnTextActive: { color: C.accent },
  filterPopover: {
    position: 'absolute',
    top: HEADER_HEIGHT + 1,
    width: COL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  filterClearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterClearText: { fontSize: 9, color: C.textSecondary, lineHeight: 9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
    cursor: 'pointer',
  },
  rowEven: { backgroundColor: C.bg },
  rowOdd: { backgroundColor: C.surface },
  rowSelected: { backgroundColor: C.rowSelected },
  rowPressed: { opacity: 0.7 },
  cellText: { fontSize: 13, color: C.text },
  cellNull: { color: C.textMuted, fontStyle: 'italic' },
  cellHighlight: { backgroundColor: '#3d3000', color: '#f5c542', fontWeight: '600' },
  idxText: { fontSize: 11, color: C.textMuted, fontWeight: '600', textAlign: 'center' },
  noResults: { paddingVertical: 32, alignItems: 'center' },
  noResultsText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  placeholderEmoji: { fontSize: 36, marginBottom: 16 },
  placeholderTitle: { fontSize: 15, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
  placeholderSub: { fontSize: 13, color: C.textMuted },
  placeholderText: { fontSize: 14, color: C.textSecondary, marginTop: 14 },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 6,
    height: HEADER_HEIGHT,
    cursor: 'col-resize' as any,
    zIndex: 10,
  },
  jsonCell: { flexDirection: 'row', alignItems: 'center', gap: 5, overflow: 'hidden' },
  jsonBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    flexShrink: 0,
  },
});
