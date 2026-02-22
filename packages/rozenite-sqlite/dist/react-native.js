import { useRef as i, useEffect as r } from "react";
import { useRozeniteDevToolsClient as u } from "@rozenite/plugin-bridge";
const L = "rozenite-sqlite", t = {
  GET_DB_LIST: "get-db-list",
  SEND_DB_LIST: "send-db-list",
  SQL_EXECUTE: "sql-execute",
  SQL_EXEC_RESULT: "sql-exec-result"
};
function f(o) {
  const e = u({ pluginId: L }), n = i(o);
  r(() => {
    n.current = o;
  }), r(() => {
    if (!e) return;
    const c = [
      e.onMessage(t.GET_DB_LIST, () => {
        e.send(t.SEND_DB_LIST, n.current.databases);
      }),
      e.onMessage(t.SQL_EXECUTE, (E) => {
        const { dbName: S, query: _ } = E;
        n.current.sqlExecutor(S, _).then(
          (s) => {
            e.send(t.SQL_EXEC_RESULT, s);
          },
          (s) => {
            e.send(t.SQL_EXEC_RESULT, {
              error: s instanceof Error ? s.message : String(s)
            });
          }
        );
      })
    ];
    return () => {
      c.forEach((E) => E.remove());
    };
  }, [e]);
}
export {
  f as useRozeniteSQLite
};
