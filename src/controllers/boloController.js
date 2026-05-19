const db = require("../config/db");

exports.getAllBolos = (req, res) => {
  db.all("SELECT * FROM bolo WHERE ativo = 1 OR ativo IS NULL", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createBolo = (req, res) => {
  const { nome, descricao, preco, imagem, categoria } = req.body;
  const sql = `INSERT INTO bolo (nome, descricao, preco, imagem, categoria) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [nome, descricao, preco, imagem, categoria ?? null], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id_bolo: this.lastID, ...req.body });
  });
};

exports.updateBolo = (req, res) => {
  const { nome, descricao, preco, imagem, categoria } = req.body;
  const sql = `UPDATE bolo SET nome = ?, descricao = ?, preco = ?, imagem = ?, categoria = ? WHERE id_bolo = ?`;

  db.run(sql, [nome, descricao, preco, imagem, categoria ?? null, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.deleteBolo = (req, res) => {
  db.run("DELETE FROM bolo WHERE id_bolo = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};

exports.syncProducts = (req, res) => {
  const products = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.json({ message: "0 produtos sincronizados." });
  }

  let completed = 0;
  let failed = false;

  products.forEach((product) => {
    db.run(
      `INSERT OR REPLACE INTO bolo (id_bolo, nome, descricao, preco, imagem) VALUES (?, ?, ?, ?, ?)`,
      [Number.parseInt(product.id), product.name, product.description, product.price, product.image || ""],
      (err) => {
        if (failed) return;
        if (err) {
          failed = true;
          return res.status(500).json({ error: err.message });
        }
        completed++;
        if (completed === products.length) {
          res.json({ message: `${completed} produtos sincronizados.` });
        }
      }
    );
  });
};
