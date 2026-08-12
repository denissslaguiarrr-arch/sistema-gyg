const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_DIR = path.join(__dirname, "..", "db");
const DB_PATH = path.join(DB_DIR, "concesionaria.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

function openDatabase() {
  fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);

  return db;
}

const db = openDatabase();

module.exports = { db, DB_PATH };
