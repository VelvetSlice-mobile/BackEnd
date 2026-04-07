const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./velvetslice_server.db");

db.run("PRAGMA foreign_keys = ON");

db.serialize(() => {
  // 1. Tabela de Clientes
  db.run(`CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20)
  )`);

  // 2. Tabela de Endereço 
  db.run(`CREATE TABLE IF NOT EXISTS endereco (
    id_endereco INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_endereco VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    CEP VARCHAR(10),
    estado CHAR(2),
    complemento VARCHAR(100)
  )`);

  // 3. Tabela Endereço Entrega 
  db.run(`CREATE TABLE IF NOT EXISTS endereco_entrega (
    fk_Cliente_id_cliente INTEGER,
    fk_Endereco_id_endereco INTEGER,
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY(fk_Endereco_id_endereco) REFERENCES endereco(id_endereco) ON DELETE CASCADE
  )`);

  // 4. Tabela de Bolo 
  db.run(`CREATE TABLE IF NOT EXISTS bolo (
    id_bolo INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    descricao TEXT,
    preco DECIMAL(10,2),
    imagem VARCHAR(255)
  )`);

  // 5. Tabela de Pedidos
  db.run(`CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    data_pedido DATETIME,
    valor_total DECIMAL(10,2),
    status_pedido VARCHAR(50),
    metodo_pagamento VARCHAR(50),
    fk_cliente_id_cliente INTEGER,
    FOREIGN KEY(fk_cliente_id_cliente) REFERENCES cliente(id_cliente)
  )`);

  // 6. Tabela de Item Pedido 
  db.run(`CREATE TABLE IF NOT EXISTS item_pedido (
    id_item_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    quantidade INT,
    preco_unitario DECIMAL(10,2),
    tamanho VARCHAR(20),
    fk_Pedido_id_pedido INTEGER,
    fk_Bolo_id_bolo INTEGER,
    FOREIGN KEY(fk_Pedido_id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY(fk_Bolo_id_bolo) REFERENCES bolo(id_bolo)
  )`);
});

module.exports = db;