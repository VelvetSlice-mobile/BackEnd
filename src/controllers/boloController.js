const db = require("../config/db");


exports.getAllBolos = (req, res) => {
  db.all("SELECT * FROM bolo", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};


exports.createBolo = (req, res) => {
  const { nome, descricao, preco, imagem } = req.body;

  const sql = `INSERT INTO bolo (nome, descricao, preco, imagem) 
               VALUES (?, ?, ?, ?)`;

  db.run(sql, [nome, descricao, preco, imagem], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id_bolo: this.lastID, ...req.body });
  });
};


exports.updateBolo = (req, res) => {
  const { nome, descricao, preco, imagem } = req.body;
  const sql = `UPDATE bolo SET nome = ?, descricao = ?, preco = ?, imagem = ? 
               WHERE id_bolo = ?`;

  db.run(sql, [nome, descricao, preco, imagem, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};


exports.deleteBolo = (req, res) => {
  db.run("DELETE FROM bolo WHERE id_bolo = ?", req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};


exports.syncProducts = (req, res) => {
  const products = req.body;
  let synced = 0;
  products.forEach((product) => {
    db.run(
      `INSERT OR REPLACE INTO bolo (id_bolo, nome, descricao, preco, imagem) VALUES (?, ?, ?, ?, ?)`,
      [parseInt(product.id), product.name, product.description, product.price, product.image || ''],
      (err) => {
        if (err) {
          console.error('Erro ao sync produto:', err);
          return res.status(500).json({ error: err.message });
        }
        synced++;
        if (synced === products.length) {
          res.json({ message: `${synced} produtos sincronizados.` });
        }
      }
    );
  });
};