export declare interface RozeniteSQLiteConfig {
    /** List of database names exposed to the devtools panel, e.g. ["app.db", "cache.db"] */
    databases: string[];
    /** Library-agnostic SQL runner — receives the db name and raw query, returns rows */
    sqlExecutor: SQLExecutor;
}

export declare type SQLExecutor = (dbName: string, query: string) => Promise<Record<string, unknown>[]>;

/**
 * Connects your React Native app to the SQLighter devtools panel.
 *
 * Call this once somewhere near the root of your app (or in the component
 * that holds the database instances). It handles all devtools communication —
 * you don't need to touch the plugin-bridge directly.
 *
 * @example
 * useRozeniteSQLite({
 *   databases: ['app.db', 'cache.db'],
 *   sqlExecutor: async (dbName, query) => {
 *     const db = myDatabases[dbName];
 *     return db.getAllAsync(query);
 *   },
 * });
 */
export declare function useRozeniteSQLite(config: RozeniteSQLiteConfig): void;

export { }
