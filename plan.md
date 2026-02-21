# Refactor Plan

Priority order: each item is independent and can be done in sequence or in parallel.

---

## 1. ✅ [Critical] Handle `sql-exec-result` error responses

**Problem:** The app sends `{ error: string }` when a query fails, but the panel handler only does `Array.isArray(result)` — any error leaves `loadingTables` or `loadingData` stuck at `true` forever.

**Files:** `src/hooks/useExplorerState.ts`

**Changes:**
- Add `error: string | null` to `ExplorerState`
- Add `SET_ERROR` action to the reducer
- In the `sql-exec-result` handler, check `result?.error` first and dispatch `SET_ERROR`
- In `DataTable.tsx`, add an error placeholder state that renders when `error !== null`

---

## 2. ✅ [Critical] Remove dead `queryMode` state

**Problem:** `queryMode: 'tables' | 'data' | null` is stored in state and updated by the reducer, but is never read by any component or hook — `pendingRef` fully replaced it. It's dead weight and misleads future readers.

**Files:** `src/hooks/useExplorerState.ts`

**Changes:**
- Remove `queryMode` from `ExplorerState` interface
- Remove it from `initial`
- Remove `queryMode: 'tables'` / `queryMode: 'data'` from `LOAD_TABLES_START` and `LOAD_DATA_START` reducer cases

---

## 3. ✅ [High] Extract shared `constants.ts`

**Problem:** Plugin ID, all event name strings, and the `sqlite_master` query are inlined across `useExplorerState.ts`, `useRozeniteSQLite.ts`, and any future files. Renaming any event requires a grep.

**Files:** create `src/constants.ts`

**Changes:**
- `PLUGIN_ID = 'rozenite-sqlite'`
- `EVENTS = { GET_DB_LIST, SEND_DB_LIST, SQL_EXECUTE, SQL_EXEC_RESULT } as const`
- `QUERIES = { LIST_TABLES: "SELECT name FROM sqlite_master WHERE ..." }` as const
- Replace all inlined strings in `useExplorerState.ts` and `useRozeniteSQLite.ts`

---

## 4. ✅ [High] Split `useExplorerState` — extract `useBridgeSync`

**Problem:** One hook owns the reducer, three async effects wired to the plugin bridge, a `pendingRef`, and six callbacks. Two separate concerns.

**Files:** create `src/hooks/useBridgeSync.ts`, update `src/hooks/useExplorerState.ts`

**Changes:**
- `useBridgeSync(dispatch, client)` owns: `pendingRef`, all three `useEffect`s that call `client.send` / `client.onMessage`, subscription cleanup
- `useExplorerState` owns: reducer, `useCallback` actions, exports — calls `useBridgeSync` internally

---

## 5. ✅ [High] Replace parallel loading booleans with a single `status` field

**Problem:** `connecting: boolean`, `loadingTables: boolean`, `loadingData: boolean` are three booleans that are mutually exclusive in practice. Impossible combined states (`loadingTables: true` + `loadingData: true`) can exist in the type but never should.

**Files:** `src/hooks/useExplorerState.ts`, `src/components/DataTable.tsx`, `src/components/Toolbar.tsx`, `src/panel.tsx`

**Changes:**
- Replace the three booleans with `status: 'connecting' | 'idle' | 'loadingTables' | 'loadingData' | 'error'`
- Update all reducer cases to set `status` instead of individual booleans
- Update all consumers that read `connecting`, `loadingTables`, `loadingData`

---

## 6. ✅ [Medium] Fix `get-db-list` payload

**Problem:** `client.send('get-db-list', true)` — the payload has been `undefined`, `false`, and `true` across debug iterations. It should be `undefined` and typed.

**Files:** `src/hooks/useExplorerState.ts`

**Changes:**
- Change `client.send('get-db-list', true)` → `client.send('get-db-list', undefined)`
- Covered automatically once constants.ts is in place (item 3)

---

## 7. ✅ [Medium] Eliminate `as any` in StyleSheets

**Problem:** `cursor`, `scrollbarWidth`, `scrollbarColor`, `outlineStyle`, `overflow: 'visible'` all use `as any` casts. Causes a TS compile error in `DataTable.tsx` and hides legitimate type mistakes.

**Files:** `src/components/DataTable.tsx`, `src/components/Toolbar.tsx`, `src/components/Dropdown.tsx`, `src/components/RowDetailPanel.tsx`

**Changes:**
- Create a small `src/utils/webStyle.ts` helper:
  ```ts
  export const web = (styles: Record<string, unknown>) =>
    styles as unknown as object;