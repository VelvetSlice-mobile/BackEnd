const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Configuração do Banco de Dados
const db = new sqlite3.Database("./velvetslice_server.db");

db.serialize(() => {
  // 1. Tabela de Clientes
  db.run(`CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20)
  )`);

  // 2. Tabela de Bolos/Produtos
  db.run(`CREATE TABLE IF NOT EXISTS bolo (
    id_bolo INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100),
    descricao TEXT,
    preco DECIMAL(10,2),
    imagem VARCHAR(255)
  )`);

  // 3. Tabela de Endereço
  db.run(`CREATE TABLE IF NOT EXISTS endereco (
    id_endereco INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_endereco VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    CEP VARCHAR(10),
    estado CHAR(2),
    complemento VARCHAR(100),
    fk_Cliente_id_cliente INTEGER,
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente)
  )`);

  // 4. Tabela de Pedidos
  db.run(`CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    data_pedido DATETIME,
    valor_total DECIMAL(10,2),
    status_pedido VARCHAR(50),
    metodo_pagamento VARCHAR(50),
    fk_Cliente_id_cliente INTEGER,
    FOREIGN KEY(fk_Cliente_id_cliente) REFERENCES cliente(id_cliente)
  )`);
});

// ==========================================
// CRUD: CLIENTE
// ==========================================

// Create: Registro
app.post("/api/register", (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  const sql = `INSERT INTO cliente (nome, email, senha, telefone) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, email, senha, telefone], function (err) {
    if (err) return res.status(400).json({ error: "Email já cadastrado" });
    res.status(201).json({ id: this.lastID, nome });
  });
});

// Read: Listar todos clientes
app.get("/api/clientes", (req, res) => {
  db.all("SELECT id_cliente, nome, email, telefone FROM cliente", [], (err, rows) => {
    res.json(rows);
  });
});

// Update: Editar dados do perfil
app.put("/api/clientes/:id", (req, res) => {
  const { nome, email, telefone } = req.body;
  const sql = `UPDATE cliente SET nome = ?, email = ?, telefone = ? WHERE id_cliente = ?`;
  db.run(sql, [nome, email, telefone, req.params.id], function(err) {
    res.json({ updated: this.changes });
  });
});

// Delete: Remover conta
app.delete("/api/clientes/:id", (req, res) => {
  db.run("DELETE FROM cliente WHERE id_cliente = ?", req.params.id, function(err) {
    res.json({ deleted: this.changes });
  });
});

// ==========================================
// CRUD: BOLOS (PRODUTOS)
// ==========================================

// Create: Adicionar novo bolo
app.post("/api/products", (req, res) => {
  const { nome, descricao, preco, imagem } = req.body;
  const sql = `INSERT INTO bolo (nome, descricao, preco, imagem) VALUES (?, ?, ?, ?)`;
  db.run(sql, [nome, descricao, preco, imagem], function(err) {
    res.status(201).json({ id: this.lastID });
  });
});

// Read: Listar bolos
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM bolo", [], (err, rows) => {
    res.json(rows);
  });
});

// Update: Editar bolo
app.put("/api/products/:id", (req, res) => {
  const { nome, descricao, preco } = req.body;
  db.run(`UPDATE bolo SET nome = ?, descricao = ?, preco = ? WHERE id_bolo = ?`, 
    [nome, descricao, preco, req.params.id], function(err) {
    res.json({ updated: this.changes });
  });
});

// Delete: Remover bolo
app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM bolo WHERE id_bolo = ?", req.params.id, function(err) {
    res.json({ deleted: this.changes });
  });
});

// ==========================================
// CRUD: ENDEREÇO
// ==========================================

// Create: Novo endereço
app.post("/api/addresses", (req, res) => {
  const { nome_endereco, logradouro, numero, CEP, estado, complemento, fk_Cliente_id_cliente } = req.body;
  const sql = `INSERT INTO endereco (nome_endereco, logradouro, numero, CEP, estado, complemento, fk_Cliente_id_cliente) VALUES (?,?,?,?,?,?,?)`;
  db.run(sql, [nome_endereco, logradouro, numero, CEP, estado, complemento, fk_Cliente_id_cliente], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id_endereco: this.lastID, ...req.body });
  });
});

// Read: Buscar TODOS os endereços do cliente
app.get("/api/addresses/:id_cliente", (req, res) => {
  const sql = "SELECT * FROM endereco WHERE fk_Cliente_id_cliente = ?";
  db.all(sql, [req.params.id_cliente], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Retorna a lista completa (array)
    res.json(rows || []); 
  });
});

// Update: Editar endereço
app.put("/api/addresses/:id", (req, res) => {
  const { nome_endereco, logradouro, numero, CEP, estado, complemento } = req.body;
  const sql = `UPDATE endereco 
               SET nome_endereco = ?, logradouro = ?, numero = ?, CEP = ?, estado = ?, complemento = ? 
               WHERE id_endereco = ?`;
  
  db.run(sql, [nome_endereco, logradouro, numero, CEP, estado, complemento, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Delete: Remover endereço
app.delete("/api/addresses/:id", (req, res) => {
  db.run("DELETE FROM endereco WHERE id_endereco = ?", req.params.id, function(err) {
    res.json({ deleted: this.changes });
  });
});

// ==========================================
// CRUD: PEDIDOS
// ==========================================

// Create: Novo pedido (PAGAMENTO)
app.post("/api/orders", (req, res) => {
  const { valor_total, metodo_pagamento, fk_Cliente_id_cliente } = req.body;
  const data_pedido = new Date().toISOString();
  const sql = `INSERT INTO pedido (data_pedido, valor_total, status_pedido, metodo_pagamento, fk_Cliente_id_cliente) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [data_pedido, valor_total, "Pendente", metodo_pagamento, fk_Cliente_id_cliente], function(err) {
    res.status(201).json({ id_pedido: this.lastID, message: "Pedido realizado!" });
  });
});

// Read: Listar todos pedidos de um cliente
app.get("/api/orders/:id_cliente", (req, res) => {
  db.all("SELECT * FROM pedido WHERE fk_Cliente_id_cliente = ?", [req.params.id_cliente], (err, rows) => {
    res.json(rows);
  });
});

// Update: Mudar status do pedido (Para o Admin)
app.put("/api/orders/:id", (req, res) => {
  const { status_pedido } = req.body;
  db.run("UPDATE pedido SET status_pedido = ? WHERE id_pedido = ?", [status_pedido, req.params.id], function(err) {
    res.json({ updated: this.changes });
  });
});

// Delete: Cancelar pedido
app.delete("/api/orders/:id", (req, res) => {
  db.run("DELETE FROM pedido WHERE id_pedido = ?", req.params.id, function(err) {
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Velvet Slice rodando na porta ${PORT}`);
});