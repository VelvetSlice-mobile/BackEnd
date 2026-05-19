const db = require("../config/db");


exports.createOrder = (req, res) => {
  const {
    valor_total,
    metodo_pagamento,
    fk_Cliente_id_cliente,
    fk_cliente_id_cliente,
    fk_Endereco_id_endereco,
    cupom_codigo,
    desconto_valor,
    itens,
  } = req.body;
  const fkCliente = fk_Cliente_id_cliente ?? fk_cliente_id_cliente;
  const data_pedido = new Date().toISOString();

  const sqlPedido = `INSERT INTO pedido (data_pedido, valor_total, status_pedido, metodo_pagamento, fk_Cliente_id_cliente, fk_Endereco_id_endereco, cupom_codigo, desconto_valor)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sqlPedido, [data_pedido, valor_total, "Pendente", metodo_pagamento, fkCliente, fk_Endereco_id_endereco ?? null, cupom_codigo ?? null, desconto_valor ?? 0], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const id_pedido_gerado = this.lastID;
    const sqlItem = `INSERT INTO item_pedido (quantidade, preco_unitario, tamanho, fk_Pedido_id_pedido, fk_Bolo_id_bolo)
                     VALUES (?, ?, ?, ?, ?)`;

    let completed = 0;
    itens.forEach((item, index) => {
      db.run(sqlItem, [item.quantidade, item.preco_unitario, item.tamanho || "Padrão", id_pedido_gerado, Number.parseInt(item.id_bolo)], function (err) {
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
  const sqlPedidos = `
    SELECT p.id_pedido, p.data_pedido, p.valor_total, p.status_pedido, p.metodo_pagamento,
           p.cupom_codigo, p.desconto_valor,
           e.logradouro, e.numero, e.CEP, e.bairro, e.cidade, e.estado, e.nome_endereco, e.complemento
    FROM pedido p
    LEFT JOIN endereco e ON p.fk_Endereco_id_endereco = e.id_endereco
    WHERE p.fk_Cliente_id_cliente = ?
    ORDER BY p.id_pedido DESC
  `;
  db.all(sqlPedidos, [req.params.id_cliente], (err, pedidos) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pedidos.length) return res.json([]);

    const ids = pedidos.map((p) => p.id_pedido);
    const placeholders = ids.map(() => "?").join(",");
    const sqlItens = `
      SELECT ip.fk_Pedido_id_pedido, ip.quantidade, ip.preco_unitario, ip.tamanho,
             b.id_bolo, b.nome, b.imagem
      FROM item_pedido ip
      JOIN bolo b ON ip.fk_Bolo_id_bolo = b.id_bolo
      WHERE ip.fk_Pedido_id_pedido IN (${placeholders})
    `;
    db.all(sqlItens, ids, (err2, itens) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const itensByPedido = {};
      for (const item of itens) {
        const pid = item.fk_Pedido_id_pedido;
        if (!itensByPedido[pid]) itensByPedido[pid] = [];
        itensByPedido[pid].push({
          id_bolo: item.id_bolo,
          nome: item.nome,
          imagem: item.imagem,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          tamanho: item.tamanho,
        });
      }

      const result = pedidos.map((p) => ({
        ...p,
        itens: itensByPedido[p.id_pedido] || [],
      }));
      res.json(result);
    });
  });
};


exports.getOrderItems = (req, res) => {
  const sql = `
    SELECT ip.id_item_pedido, ip.quantidade, ip.preco_unitario, ip.tamanho,
           b.id_bolo, b.nome, b.imagem
    FROM item_pedido ip
    JOIN bolo b ON ip.fk_Bolo_id_bolo = b.id_bolo
    WHERE ip.fk_Pedido_id_pedido = ?
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
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

  db.run("DELETE FROM pedido WHERE id_pedido = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};