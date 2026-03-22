import { useRef as f, useEffect as L } from "react";
import { useRozeniteDevToolsClient as U } from "@rozenite/plugin-bridge";
const m = "rozenite-sqlite", s = {
  GET_DB_LIST: "get-db-list",
  SEND_DB_LIST: "send-db-list",
  SQL_EXECUTE: "sql-execute",
  SQL_EXEC_RESULT: "sql-exec-result",
  SAVE_ROW: "save-row",
  DELETE_ROW: "delete-row",
  CLEAR_TABLE: "clear-table",
  MUTATION_RESULT: "mutation-result"
};
function S(n) {
  return n == null ? "NULL" : typeof n == "number" ? String(n) : typeof n == "boolean" ? n ? "1" : "0" : `'${String(n).replace(/'/g, "''")}'`;
}
function N(n) {
  const e = U({ pluginId: m }), T = f(n);
  L(() => {
    T.current = n;
  }), L(() => {
    if (!e) return;
    const _ = [
      e.onMessage(s.GET_DB_LIST, () => {
        e.send(s.SEND_DB_LIST, T.current.databases);
      }),
      e.onMessage(s.SQL_EXECUTE, (r) => {
        const { dbName: o, query: u } = r;
        T.current.sqlExecutor(o, u).then(
          (t) => {
            e.send(s.SQL_EXEC_RESULT, t);
          },
          (t) => {
            e.send(s.SQL_EXEC_RESULT, {
              error: t instanceof Error ? t.message : String(t)
            });
          }
        );
      }),
      e.onMessage(s.SAVE_ROW, (r) => {
        const { dbName: o, table: u, row: t, primaryKey: E } = r, i = t[E], l = Object.keys(t).filter((c) => c !== E).map((c) => `"${c}" = ${S(t[c])}`).join(", "), R = `UPDATE "${u}" SET ${l} WHERE "${E}" = ${S(i)}`;
        T.current.sqlExecutor(o, R).then(
          () => e.send(s.MUTATION_RESULT, { success: !0 }),
          (c) => e.send(s.MUTATION_RESULT, {
            success: !1,
            error: c instanceof Error ? c.message : String(c)
          })
        );
      }),
      e.onMessage(s.DELETE_ROW, (r) => {
        const { dbName: o, table: u, primaryKey: t, primaryKeyValue: E } = r, i = `DELETE FROM "${u}" WHERE "${t}" = ${S(E)}`;
        T.current.sqlExecutor(o, i).then(
          () => e.send(s.MUTATION_RESULT, { success: !0 }),
          (a) => e.send(s.MUTATION_RESULT, {
            success: !1,
            error: a instanceof Error ? a.message : String(a)
          })
        );
      }),
      e.onMessage(s.CLEAR_TABLE, (r) => {
        const { dbName: o, table: u } = r, t = `DELETE FROM "${u}"`;
        T.current.sqlExecutor(o, t).then(
          () => e.send(s.MUTATION_RESULT, { success: !0 }),
          (E) => e.send(s.MUTATION_RESULT, {
            success: !1,
            error: E instanceof Error ? E.message : String(E)
          })
        );
      })
    ];
    return () => {
      _.forEach((r) => r.remove());
    };
  }, [e]);
}
export {
  N as useRozeniteSQLite
};
