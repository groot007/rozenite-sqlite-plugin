export const PLUGIN_ID = 'rozenite-sqlite' as const;

export const EVENTS = {
  GET_DB_LIST: 'get-db-list',
  SEND_DB_LIST: 'send-db-list',
  SQL_EXECUTE: 'sql-execute',
  SQL_EXEC_RESULT: 'sql-exec-result',
} as const;

export const QUERIES = {
  LIST_TABLES:
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
} as const;
