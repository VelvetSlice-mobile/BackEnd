const db = require("../config/db");

exports.getAvaliacoes = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT av.id_avaliacao, av.nota, av.comentario, av.data_avaliacao,
           av.fk_Cliente_id_cliente as id_cliente,
           c.nome, c.avatar_url
    FROM avaliacao av
    JOIN cliente c ON av.fk_Cliente_id_cliente = c.id_cliente
    WHERE av.fk_Bolo_id_bolo = ?
    ORDER BY av.data_avaliacao DESC
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

exports.createAvaliacao = (req, res) => {
  const { id } = req.params;
  const { nota, comentario, fk_Cliente_id_cliente } = req.body;

  if (!nota || nota < 1 || nota > 5) {
    return res.status(400).json({ error: "Nota inválida." });
  }
  if (!fk_Cliente_id_cliente) {
    return res.status(400).json({ error: "Cliente não identificado." });
  }

  const sql = `
    INSERT INTO avaliacao (nota, comentario, fk_Cliente_id_cliente, fk_Bolo_id_bolo)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [nota, comentario?.trim() || null, fk_Cliente_id_cliente, id], function (err) {
    if (err) {
      if (err.message?.includes("UNIQUE")) {
        return res.status(409).json({ error: "Você já avaliou este produto." });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id_avaliacao: this.lastID });
  });
};

exports.getByCliente = (req, res) => {
  const { clientId } = req.params;
  const sql = `
    SELECT av.id_avaliacao, av.nota, av.comentario, av.data_avaliacao,
           b.nome as nome_bolo, b.id_bolo
    FROM avaliacao av
    JOIN bolo b ON av.fk_Bolo_id_bolo = b.id_bolo
    WHERE av.fk_Cliente_id_cliente = ?
    ORDER BY av.data_avaliacao DESC
  `;
  db.all(sql, [clientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
};

exports.updateAvaliacao = (req, res) => {
  const { id } = req.params;
  const { nota, comentario } = req.body;
  if (!nota || nota < 1 || nota > 5) {
    return res.status(400).json({ error: "Nota inválida." });
  }
  db.run(
    "UPDATE avaliacao SET nota = ?, comentario = ? WHERE id_avaliacao = ?",
    [nota, comentario?.trim() || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Avaliação não encontrada." });
      res.json({ updated: this.changes });
    }
  );
};

exports.deleteAvaliacao = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM avaliacao WHERE id_avaliacao = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Avaliação não encontrada." });
    res.json({ deleted: this.changes });
  });
};
