const db = require("../config/db");

// Create: Novo pedido (Com Itens do Pedido)
exports.createOrder = (req, res) => {
  const { valor_total, metodo_pagamento, fk_cliente_id_cliente, itens } = req.body;
  const data_pedido = new Date().toISOString();

  // 1. Tabela 'pedido' -
  const sqlPedido = `INSERT INTO pedido (data_pedido, valor_total, status_pedido, metodo_pagamento, fk_cliente_id_cliente) 
                     VALUES (?, ?, ?, ?, ?)`;

  db.run(sqlPedido, [data_pedido, valor_total, "Pendente", metodo_pagamento, fk_cliente_id_cliente], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    const id_pedido_gerado = this.lastID;
    const sqlItem = `INSERT INTO item_pedido (quantidade, preco_unitario, tamanho, fk_Pedido_id_pedido, fk_Bolo_id_bolo) 
                     VALUES (?, ?, ?, ?, ?)`;

    itens.forEach((item) => {
    
      db.run(sqlItem, [item.quantidade, item.preco_unitario, item.tamanho || "Padrão", id_pedido_gerado, item.id_bolo]);
    });

    res.status(201).json({ 
      id_pedido: id_pedido_gerado, 
      message: "Pedido e itens registrados com sucesso!" 
    });
  });
};

// Read: Listar pedidos de um cliente
exports.getOrdersByClient = (req, res) => {
  const sql = "SELECT * FROM pedido WHERE fk_cliente_id_cliente = ?";
  db.all(sql, [req.params.id_cliente], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Update: Mudar status 
exports.updateOrderStatus = (req, res) => {
  const { status_pedido } = req.body;
 
  db.run("UPDATE pedido SET status_pedido = ? WHERE id_pedido = ?", [status_pedido, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

// Delete: Cancelar pedido
exports.deleteOrder = (req, res) => {

  db.run("DELETE FROM pedido WHERE id_pedido = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};