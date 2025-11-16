const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_number TEXT UNIQUE,
      otp TEXT,
      app_limit INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      app_name TEXT,
      package_name TEXT,
      app_url TEXT,
      icon_path TEXT,
      status TEXT,
      apk_path TEXT,
      aab_path TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Insert default admin user if not exists
  db.run("INSERT OR IGNORE INTO users (whatsapp_number, otp) VALUES ('admin', 'admin123')");
  // Insert default api key and device id if not exists
  db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('api_key', '')");
  db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('device_id', '')");
});

module.exports = db;
