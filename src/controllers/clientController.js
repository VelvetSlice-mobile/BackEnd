const db = require("../config/db");

exports.registerClient = (req, res) => {
  const { nome, email, senha, telefone } = req.body;
  const sql = `INSERT INTO cliente (nome, email, senha, telefone) VALUES (?, ?, ?, ?)`;

  db.run(sql, [nome, email, senha, telefone], function (err) {
    if (err) {
      return res
        .status(400)
        .json({ error: "Email já cadastrado ou erro no banco." });
    }

    res.status(201).json({ id_cliente: this.lastID, nome, email, telefone });
  });
};

exports.loginClient = (req, res) => {
  const { email, senha } = req.body;
  const sql = `SELECT id_cliente, nome, email, telefone FROM cliente WHERE email = ? AND senha = ?`;

  db.get(sql, [email, senha], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Credenciais inválidas." });
    res.json(row);
  });
};

exports.getAllClients = (req, res) => {
  db.all(
    "SELECT id_cliente, nome, email, telefone FROM cliente",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
};

exports.updateClient = (req, res) => {
  const { nome, email, telefone } = req.body;

  const sql = `UPDATE cliente SET nome = ?, email = ?, telefone = ? WHERE id_cliente = ?`;

  db.run(sql, [nome, email, telefone, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

exports.deleteClient = (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM cliente WHERE id_cliente = ?", id, function (err) {
    if (err) {
      return res.status(500).json({
        error:
          "Não foi possível deletar a conta. Verifique se existem pedidos vinculados a este usuário.",
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    res.json({ message: "Conta removida com sucesso!", deleted: this.changes });
  });
};
