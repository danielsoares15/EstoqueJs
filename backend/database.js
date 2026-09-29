const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'estoque.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS vendedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    descricao TEXT,
    imagem TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    produto_nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    total REAL NOT NULL,
    vendedor_id INTEGER NOT NULL,
    vendedor_nome TEXT NOT NULL,
    forma_pagamento TEXT NOT NULL CHECK(forma_pagamento IN ('avista', 'parcelado')),
    parcelas INTEGER DEFAULT 1,
    cliente_nome TEXT,
    cliente_contato TEXT,
    cliente_endereco TEXT,
    status_pagamento TEXT NOT NULL DEFAULT 'confirmado' CHECK(status_pagamento IN ('pendente', 'confirmado')),
    data_confirmacao DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (vendedor_id) REFERENCES vendedores(id)
  )
`);

module.exports = db;
