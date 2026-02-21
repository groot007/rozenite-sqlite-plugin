// Database configurations
export const DB_CONFIG = {
  users: {
    tables: {
      users: {
        name: "users",
        columns: ["id", "name", "email", "age"],
        createSQL: `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          age INTEGER
        );`,
      },
      preferences: {
        name: "preferences",
        columns: ["id", "user_id", "theme", "language"],
        createSQL: `CREATE TABLE IF NOT EXISTS preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          theme TEXT,
          language TEXT
        );`,
      },
      activity_log: {
        name: "activity_log",
        columns: ["id", "user_id", "action", "timestamp"],
        createSQL: `CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT,
          timestamp TEXT
        );`,
      },
    },
  },
  products: {
    tables: {
      products: {
        name: "products",
        columns: ["id", "name", "price", "stock"],
        createSQL: `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL,
          stock INTEGER
        );`,
      },
      categories: {
        name: "categories",
        columns: ["id", "name", "description"],
        createSQL: `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT
        );`,
      },
      inventory: {
        name: "inventory",
        columns: ["id", "product_id", "location", "quantity"],
        createSQL: `CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER,
          location TEXT,
          quantity INTEGER
        );`,
      },
    },
  },
  notes: {
    tables: {
      notes: {
        name: "notes",
        columns: ["id", "title", "content", "created_at"],
        createSQL: `CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          created_at TEXT
        );`,
      },
      tags: {
        name: "tags",
        columns: ["id", "name"],
        createSQL: `CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );`,
      },
      note_tags: {
        name: "note_tags",
        columns: ["id", "note_id", "tag_id"],
        createSQL: `CREATE TABLE IF NOT EXISTS note_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          note_id INTEGER,
          tag_id INTEGER
        );`,
      },
    },
  },
  analytics: {
    tables: {
      events: {
        name: "events",
        columns: ["id", "event_name", "user_id", "metadata", "created_at"],
        createSQL: `CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_name TEXT NOT NULL,
          user_id INTEGER,
          metadata TEXT,
          created_at TEXT
        );`,
      },
      ab_tests: {
        name: "ab_tests",
        columns: ["id", "test_name", "variant", "config", "started_at"],
        createSQL: `CREATE TABLE IF NOT EXISTS ab_tests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_name TEXT NOT NULL,
          variant TEXT,
          config TEXT,
          started_at TEXT
        );`,
      },
      feature_flags: {
        name: "feature_flags",
        columns: ["id", "flag_name", "enabled", "rules", "updated_at"],
        createSQL: `CREATE TABLE IF NOT EXISTS feature_flags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          flag_name TEXT NOT NULL,
          enabled INTEGER DEFAULT 0,
          rules TEXT,
          updated_at TEXT
        );`,
      },
    },
  },
};
