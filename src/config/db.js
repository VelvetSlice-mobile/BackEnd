const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./velvetslice_server.db");

db.run("PRAGMA foreign_keys = ON");

function ensureColumnExists(tableName, columnName, columnType, done) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Erro ao verificar colunas da tabela ${tableName}:`, err.message);
      return done();
    }
    if (columns.some((col) => col.name === columnName)) return done();
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (alterErr) => {
      if (alterErr) console.error(`Erro ao adicionar coluna ${columnName} em ${tableName}:`, alterErr.message);
      done();
    });
  });
}

function ensureColumns(checks, finalCallback) {
  const run = (index) => {
    if (index >= checks.length) return finalCallback();
    const { table, column, type } = checks[index];
    ensureColumnExists(table, column, type, () => run(index + 1));
  };
  run(0);
}

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'cliente'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cupom (
    id_cupom INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) UNIQUE,
    desconto_tipo VARCHAR(10) DEFAULT 'flat',
    desconto_valor DECIMAL(10,2),
    ativo INTEGER DEFAULT 1
  )`);

  db.run(`INSERT OR IGNORE INTO cupom (codigo, desconto_tipo, desconto_valor) VALUES ('VELVET10', 'flat', 10.00)`);
  db.run(`INSERT OR IGNORE INTO cupom (codigo, desconto_tipo, desconto_valor) VALUES ('DESCONTO20', 'flat', 20.00)`);
  db.run(`INSERT OR IGNORE INTO cupom (codigo, desconto_tipo, desconto_valor) VALUES ('PRIMEIRA', 'flat', 15.00)`);

  db.run(`CREATE TABLE IF NOT EXISTS endereco (
    id_endereco INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_endereco VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    CEP VARCHAR(10),
    estado CHAR(2),
    complemento VARCHAR(100)
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS endereco_entrega (
    fk_Cliente_id_cliente INTEGER NOT NULL,
    fk_Endereco_id_endereco INTEGER NOT NULL,
    PRIMARY KEY (fk_Cliente_id_cliente, fk_Endereco_id_endereco),
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY(fk_Endereco_id_endereco) REFERENCES endereco(id_endereco) ON DELETE CASCADE
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS bolo (
    id_bolo INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    descricao TEXT,
    preco DECIMAL(10,2),
    imagem VARCHAR(255)
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    data_pedido DATETIME,
    valor_total DECIMAL(10,2),
    status_pedido VARCHAR(50),
    metodo_pagamento VARCHAR(30),
    fk_Cliente_id_cliente INTEGER NOT NULL,
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente)
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS item_pedido (
    id_item_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    quantidade INT,
    preco_unitario DECIMAL(10,2),
    tamanho VARCHAR(20),
    fk_Pedido_id_pedido INTEGER NOT NULL,
    fk_Bolo_id_bolo INTEGER NOT NULL,
    FOREIGN KEY(fk_Pedido_id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY(fk_Bolo_id_bolo) REFERENCES bolo(id_bolo)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS avaliacao (
    id_avaliacao INTEGER PRIMARY KEY AUTOINCREMENT,
    nota INTEGER NOT NULL CHECK(nota BETWEEN 1 AND 5),
    comentario TEXT,
    data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    fk_Cliente_id_cliente INTEGER NOT NULL,
    fk_Bolo_id_bolo INTEGER NOT NULL,
    UNIQUE(fk_Cliente_id_cliente, fk_Bolo_id_bolo),
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY(fk_Bolo_id_bolo) REFERENCES bolo(id_bolo) ON DELETE CASCADE
  )`);

  ensureColumns([
    { table: "cliente", column: "avatar_url", type: "TEXT" },
    { table: "cliente", column: "role", type: "VARCHAR(20) DEFAULT 'cliente'" },
    { table: "cliente", column: "ultima_alteracao_senha", type: "TEXT" },
    { table: "endereco", column: "bairro", type: "VARCHAR(100)" },
    { table: "endereco", column: "cidade", type: "VARCHAR(100)" },
    { table: "pedido", column: "fk_Endereco_id_endereco", type: "INTEGER" },
    { table: "pedido", column: "cupom_codigo", type: "VARCHAR(50)" },
    { table: "pedido", column: "desconto_valor", type: "DECIMAL(10,2) DEFAULT 0" },
    { table: "bolo", column: "ativo", type: "INTEGER DEFAULT 1" },
    { table: "bolo", column: "categoria", type: "VARCHAR(50)" },
  ]);

});

module.exports = db;