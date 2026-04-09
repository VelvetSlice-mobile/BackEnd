const db = require("../config/db");


exports.createOrder = (req, res) => {
  const {
    valor_total,
    metodo_pagamento,
    fk_Cliente_id_cliente,
    fk_cliente_id_cliente,
    itens,
  } = req.body;
  const fkCliente = fk_Cliente_id_cliente ?? fk_cliente_id_cliente;
  const data_pedido = new Date().toISOString();


  const sqlPedido = `INSERT INTO pedido (data_pedido, valor_total, status_pedido, metodo_pagamento, fk_Cliente_id_cliente)
                     VALUES (?, ?, ?, ?, ?)`;

  db.run(sqlPedido, [data_pedido, valor_total, "Pendente", metodo_pagamento, fkCliente], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const id_pedido_gerado = this.lastID;
    const sqlItem = `INSERT INTO item_pedido (quantidade, preco_unitario, tamanho, fk_Pedido_id_pedido, fk_Bolo_id_bolo)
                     VALUES (?, ?, ?, ?, ?)`;

    let completed = 0;
    itens.forEach((item, index) => {
      db.run(sqlItem, [item.quantidade, item.preco_unitario, item.tamanho || "Padrão", id_pedido_gerado, parseInt(item.id_bolo)], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        completed++;
        if (completed === itens.length) {
          res.status(201).json({
            id_pedido: id_pedido_gerado,
            message: "Pedido e itens registrados com sucesso!"
          });
        }
      });
    });
  });
};


exports.getOrdersByClient = (req, res) => {
  const sql = "SELECT * FROM pedido WHERE fk_Cliente_id_cliente = ?";
  db.all(sql, [req.params.id_cliente], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};


exports.updateOrderStatus = (req, res) => {
  const { status_pedido } = req.body;

  db.run("UPDATE pedido SET status_pedido = ? WHERE id_pedido = ?", [status_pedido, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};


exports.deleteOrder = (req, res) => {

  db.run("DELETE FROM pedido WHERE id_pedido = ?", req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};