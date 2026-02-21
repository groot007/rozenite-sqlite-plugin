import { useRef as u, useEffect as o } from "react";
import { useRozeniteDevToolsClient as i } from "@rozenite/plugin-bridge";
function f(r) {
  const e = i({ pluginId: "rozenite-sqlite" }), n = u(r);
  o(() => {
    n.current = r;
  }), o(() => {
    if (!e) return;
    const c = [
      e.onMessage("get-db-list", () => {
        e.send("send-db-list", n.current.databases);
      }),
      e.onMessage("sql-execute", async (t) => {
        try {
          const s = await n.current.sqlExecutor(t.dbName, t.query);
          e.send("sql-exec-result", s);
        } catch (s) {
          e.send("sql-exec-result", { error: (s == null ? void 0 : s.message) ?? String(s) });
        }
      })
    ];
    return () => {
      c.forEach((t) => t.remove());
    };
  }, [e]);
}
export {
  f as useRozeniteSQLite
};
