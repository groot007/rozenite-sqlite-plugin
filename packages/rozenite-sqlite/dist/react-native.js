import { useRef as _, useEffect as E } from "react";
import { useRozeniteDevToolsClient as u } from "@rozenite/plugin-bridge";
const L = "rozenite-sqlite", t = {
  GET_DB_LIST: "get-db-list",
  SEND_DB_LIST: "send-db-list",
  SQL_EXECUTE: "sql-execute",
  SQL_EXEC_RESULT: "sql-exec-result"
};
function l(o) {
  const e = u({ pluginId: L }), r = _(o);
  E(() => {
    r.current = o;
  }), E(() => {
    if (!e) return;
    const c = [
      e.onMessage(t.GET_DB_LIST, () => {
        e.send(t.SEND_DB_LIST, r.current.databases);
      }),
      e.onMessage(t.SQL_EXECUTE, async (n) => {
        const { dbName: i, query: S } = n;
        try {
          const s = await r.current.sqlExecutor(i, S);
          e.send(t.SQL_EXEC_RESULT, s);
        } catch (s) {
          e.send(t.SQL_EXEC_RESULT, {
            error: s instanceof Error ? s.message : String(s)
          });
        }
      })
    ];
    return () => {
      c.forEach((n) => n.remove());
    };
  }, [e]);
}
export {
  l as useRozeniteSQLite
};
