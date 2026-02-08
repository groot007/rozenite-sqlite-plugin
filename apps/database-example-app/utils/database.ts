import * as SQLite from "expo-sqlite";
import { DB_CONFIG } from "../constants/dbConfig";
import { SEED_DATA } from "../constants/seedData";

// Load or create row in table
async function insertRow(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns: string[],
  values: any[]
) {
  const placeholders = columns.map(() => "?").join(", ");
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders});`,
    values
  );
}

// Seed database with initial data
export async function seedDatabase(
  db: SQLite.SQLiteDatabase,
  dbName: string
) {
  const dbSeedData = SEED_DATA[dbName as keyof typeof SEED_DATA];
  if (!dbSeedData) return;

  for (const [tableName, rows] of Object.entries(dbSeedData)) {
    const tableConfig = DB_CONFIG[dbName as keyof typeof DB_CONFIG].tables[
      tableName as any
    ];
    if (!tableConfig) continue;

    const columns = tableConfig.columns.filter((col) => col !== "id");

    for (const row of rows) {
      const values = columns.map((col) => row[col as keyof typeof row]);
      try {
        await insertRow(db, tableName, columns, values);
      } catch (error) {
        // Silently handle duplicate inserts
      }
    }
  }
}

// Load all rows from table
export async function loadTableData(
  db: SQLite.SQLiteDatabase,
  table: string
): Promise<any[]> {
  try {
    const data = await db.getAllAsync(`SELECT * FROM ${table};`);
    return data || [];
  } catch (error) {
    console.error("Error loading table data:", error);
    return [];
  }
}

// Add or update a row
export async function saveRow(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns: string[],
  formData: Record<string, string>,
  editingId: number | null
) {
  if (columns.some((col) => !formData[col])) {
    throw new Error("Please fill all fields");
  }

  if (editingId !== null) {
    const setClause = columns.map((col) => `${col} = ?`).join(", ");
    const values = [...columns.map((col) => formData[col]), editingId];
    await db.runAsync(
      `UPDATE ${table} SET ${setClause} WHERE id = ?;`,
      values
    );
  } else {
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((col) => formData[col]);
    await db.runAsync(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders});`,
      values
    );
  }
}

// Delete a row
export async function deleteRow(
  db: SQLite.SQLiteDatabase,
  table: string,
  id: number
) {
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?;`, id);
}

// Initialize all databases
export async function initializeDatabases(): Promise<
  Record<string, SQLite.SQLiteDatabase>
> {
  const dbInstances: Record<string, SQLite.SQLiteDatabase> = {};

  for (const [dbName, config] of Object.entries(DB_CONFIG)) {
    const db = SQLite.openDatabaseSync(`${dbName}.db`);
    dbInstances[dbName] = db;

    // Create all tables
    for (const table of Object.values(config.tables)) {
      await db.execAsync(table.createSQL);
    }

    // Seed with initial data
    await seedDatabase(db, dbName);
  }

  return dbInstances;
}
