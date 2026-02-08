// Seed data for all databases and tables
export const SEED_DATA = {
  users: {
    users: [
      { name: "John Doe", email: "john@example.com", age: 28 },
      { name: "Jane Smith", email: "jane@example.com", age: 32 },
    ],
    preferences: [
      { user_id: 1, theme: "dark", language: "English" },
      { user_id: 2, theme: "light", language: "Spanish" },
    ],
    activity_log: [
      { user_id: 1, action: "login", timestamp: "2025-02-08 10:30:00" },
      { user_id: 2, action: "profile_update", timestamp: "2025-02-08 11:15:00" },
    ],
  },
  products: {
    products: [
      { name: "Laptop", price: 999.99, stock: 15 },
      { name: "Mouse", price: 29.99, stock: 150 },
    ],
    categories: [
      { name: "Electronics", description: "Electronic devices and gadgets" },
      { name: "Accessories", description: "Computer accessories" },
    ],
    inventory: [
      { product_id: 1, location: "Warehouse A", quantity: 15 },
      { product_id: 2, location: "Warehouse B", quantity: 150 },
    ],
  },
  notes: {
    notes: [
      {
        title: "Meeting Notes",
        content: "Discussed Q1 roadmap and product features",
        created_at: "2025-02-08",
      },
      {
        title: "Ideas",
        content: "New feature ideas for the mobile app",
        created_at: "2025-02-07",
      },
    ],
    tags: [
      { name: "important" },
      { name: "work" },
    ],
    note_tags: [
      { note_id: 1, tag_id: 1 },
      { note_id: 2, tag_id: 2 },
    ],
  },
};
