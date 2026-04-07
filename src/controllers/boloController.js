const db = require("../config/db");

// Listar todos os bolos
exports.getAllBolos = (req, res) => {
  db.all("SELECT * FROM bolo", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Criar novo bolo
exports.createBolo = (req, res) => {
  const { nome, descricao, preco, imagem } = req.body;
  
  const sql = `INSERT INTO bolo (nome, descricao, preco, imagem) 
               VALUES (?, ?, ?, ?)`;
               
  db.run(sql, [nome, descricao, preco, imagem], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id_bolo: this.lastID, ...req.body });
  });
};

// Atualizar bolo
exports.updateBolo = (req, res) => {
  const { nome, descricao, preco, imagem } = req.body;
  const sql = `UPDATE bolo SET nome = ?, descricao = ?, preco = ?, imagem = ? 
               WHERE id_bolo = ?`;
               
  db.run(sql, [nome, descricao, preco, imagem, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

// Deletar bolo
exports.deleteBolo = (req, res) => {
  db.run("DELETE FROM bolo WHERE id_bolo = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};