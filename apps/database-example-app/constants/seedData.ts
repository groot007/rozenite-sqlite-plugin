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
  analytics: {
    events: [
      { event_name: "page_view", user_id: 1, metadata: '{"page":"/home","referrer":"google.com","duration_ms":1240,"scroll_depth":0.72}', created_at: "2025-02-08 10:30:00" },
      { event_name: "button_click", user_id: 1, metadata: '{"element":"signup_cta","page":"/home","variant":"blue"}', created_at: "2025-02-08 10:31:15" },
      { event_name: "page_view", user_id: 2, metadata: '{"page":"/pricing","referrer":"twitter.com","duration_ms":3800,"scroll_depth":1.0}', created_at: "2025-02-08 11:00:00" },
      { event_name: "purchase", user_id: 2, metadata: '{"plan":"pro","price":49.99,"currency":"USD","coupon":"WELCOME10","items":[{"id":1,"qty":1}]}', created_at: "2025-02-08 11:05:22" },
      { event_name: "error", user_id: null, metadata: '{"code":404,"path":"/old-page","ua":"Mozilla/5.0","stack":null}', created_at: "2025-02-08 11:10:00" },
      { event_name: "page_view", user_id: 3, metadata: '{"page":"/docs","referrer":null,"duration_ms":9200,"scroll_depth":0.95}', created_at: "2025-02-08 12:00:00" },
      { event_name: "form_submit", user_id: 3, metadata: '{"form":"contact","fields":["name","email","message"],"success":true}', created_at: "2025-02-08 12:05:00" },
    ],
    ab_tests: [
      { test_name: "onboarding_flow", variant: "A", config: '{"steps":["welcome","profile","tutorial"],"skip_enabled":false,"max_steps":3}', started_at: "2025-01-15" },
      { test_name: "onboarding_flow", variant: "B", config: '{"steps":["welcome","tutorial"],"skip_enabled":true,"max_steps":2}', started_at: "2025-01-15" },
      { test_name: "pricing_page", variant: "control", config: '{"layout":"cards","highlight":"pro","show_annual":false}', started_at: "2025-02-01" },
      { test_name: "pricing_page", variant: "treatment", config: '{"layout":"table","highlight":"enterprise","show_annual":true}', started_at: "2025-02-01" },
    ],
    feature_flags: [
      { flag_name: "dark_mode", enabled: 1, rules: '{"rollout":100,"segments":["all"]}', updated_at: "2025-02-01" },
      { flag_name: "new_checkout", enabled: 1, rules: '{"rollout":25,"segments":["beta_users","pro"],"exclude":["enterprise"]}', updated_at: "2025-02-07" },
      { flag_name: "ai_assistant", enabled: 0, rules: '{"rollout":0,"segments":[],"requires_flag":"new_checkout"}', updated_at: "2025-01-28" },
      { flag_name: "export_csv", enabled: 1, rules: '{"rollout":100,"segments":["all"],"min_plan":"free"}', updated_at: "2025-01-10" },
    ],
  },
};
