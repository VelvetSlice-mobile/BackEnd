const fs = require("node:fs");
const path = require("node:path");
const db = require('../config/db');
const { PRODUCT_IMAGE_DIR } = require('../config/productImageUpload');

exports.registerAdmin = (req, res) => {
  const { nome, email, senha, telefone, codigo } = req.body;
  if (!nome || !email || !senha || !codigo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  if (codigo.trim() !== (process.env.ADMIN_REGISTER_CODE || '').trim()) {
    return res.status(403).json({ error: 'Código de acesso inválido.' });
  }
  db.run(
    'INSERT INTO cliente (nome, email, senha, telefone, role) VALUES (?, ?, ?, ?, ?)',
    [nome.trim(), email.trim().toLowerCase(), senha, telefone?.trim() || null, 'admin'],
    function (err) {
      if (err) return res.status(400).json({ error: 'E-mail já cadastrado.' });
      res.status(201).json({ id_cliente: this.lastID, nome });
    }
  );
};

exports.getStats = (req, res) => {
  db.get('SELECT COUNT(*) as total FROM bolo', (err, produtos) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT COALESCE(SUM(valor_total),0) as total FROM pedido WHERE status_pedido != 'Cancelado'", (err2, vendas) => {
      if (err2) return res.status(500).json({ error: err2.message });
      db.get('SELECT COUNT(*) as total FROM pedido', (err3, pedidos) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({
          produtos: produtos.total,
          vendas: vendas.total,
          pedidos: pedidos.total,
        });
      });
    });
  });
};

exports.getMaisVendidos = (req, res) => {
  const sql = `
    SELECT b.id_bolo, b.nome, b.preco, b.imagem,
           COALESCE(SUM(ip.quantidade), 0) as total_vendido
    FROM bolo b
    LEFT JOIN item_pedido ip ON ip.fk_Bolo_id_bolo = b.id_bolo
    GROUP BY b.id_bolo
    ORDER BY total_vendido DESC
    LIMIT 10
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getAllPedidos = (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT p.*, c.nome as nome_cliente, c.telefone,
           p.id_pedido, p.data_pedido, p.valor_total, p.status_pedido,
           p.metodo_pagamento,
           (SELECT COUNT(*) FROM item_pedido WHERE fk_Pedido_id_pedido = p.id_pedido) as total_itens
    FROM pedido p
    JOIN cliente c ON c.id_cliente = p.fk_Cliente_id_cliente
  `;
  const params = [];
  if (status) {
    sql += ' WHERE p.status_pedido = ?';
    params.push(status);
  }
  sql += ' ORDER BY p.id_pedido DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.getPedidoDetalhado = (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT p.*, c.nome as nome_cliente, c.telefone, c.email,
           e.logradouro, e.numero, e.bairro, e.cidade, e.CEP, e.estado, e.complemento, e.nome_endereco
    FROM pedido p
    JOIN cliente c ON c.id_cliente = p.fk_Cliente_id_cliente
    LEFT JOIN endereco e ON e.id_endereco = p.fk_Endereco_id_endereco
    WHERE p.id_pedido = ?
  `, [id], (err, pedido) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

    db.all(`
      SELECT ip.*, b.nome, b.imagem, b.preco
      FROM item_pedido ip
      JOIN bolo b ON b.id_bolo = ip.fk_Bolo_id_bolo
      WHERE ip.fk_Pedido_id_pedido = ?
    `, [id], (err2, itens) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...pedido, itens });
    });
  });
};

exports.updatePedidoStatus = (req, res) => {
  const { id } = req.params;
  const { status_pedido } = req.body;
  if (!status_pedido) return res.status(400).json({ error: 'Status é obrigatório.' });

  db.run('UPDATE pedido SET status_pedido = ? WHERE id_pedido = ?', [status_pedido, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes, id_pedido: id, status_pedido });
  });
};

exports.getAllBolos = (req, res) => {
  db.all('SELECT * FROM bolo ORDER BY id_bolo DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createBolo = (req, res) => {
  const { nome, descricao, preco, imagem, categoria, peso } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });

  db.run(
    'INSERT INTO bolo (nome, descricao, preco, imagem, categoria, peso) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, descricao || '', Number(preco), imagem || '', categoria || null, peso || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_bolo: this.lastID, nome, descricao, preco, imagem, categoria, peso });
    }
  );
};

exports.updateBolo = (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, imagem, categoria, peso } = req.body;

  db.run(
    'UPDATE bolo SET nome = ?, descricao = ?, preco = ?, imagem = ?, categoria = ?, peso = ? WHERE id_bolo = ?',
    [nome, descricao, Number(preco), imagem, categoria || null, peso || null, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
};

exports.uploadBoloImage = (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "Envie um arquivo de imagem." });

  const imageUrl = `/uploads/products/${req.file.filename}`;

  db.get("SELECT imagem FROM bolo WHERE id_bolo = ?", [id], (err, row) => {
    if (err) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: err.message });
    }

    db.run("UPDATE bolo SET imagem = ? WHERE id_bolo = ?", [imageUrl, id], function (updateErr) {
      if (updateErr) {
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: updateErr.message });
      }

      if (row?.imagem?.startsWith("/uploads/products/")) {
        const oldPath = path.join(PRODUCT_IMAGE_DIR, path.basename(row.imagem));
        fs.unlink(oldPath, () => {});
      }

      res.json({ imagem: imageUrl });
    });
  });
};

exports.toggleBoloAtivo = (req, res) => {
  const { id } = req.params;
  db.get('SELECT ativo FROM bolo WHERE id_bolo = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Bolo não encontrado.' });
    const novoAtivo = row.ativo === 0 ? 1 : 0;
    db.run('UPDATE bolo SET ativo = ? WHERE id_bolo = ?', [novoAtivo, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ updated: this.changes, ativo: novoAtivo });
    });
  });
};

exports.deleteBolo = (req, res) => {
  db.get("SELECT imagem FROM bolo WHERE id_bolo = ?", [req.params.id], (err, row) => {
    db.run('DELETE FROM bolo WHERE id_bolo = ?', [req.params.id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });

      if (row?.imagem?.startsWith("/uploads/products/")) {
        const oldPath = path.join(PRODUCT_IMAGE_DIR, path.basename(row.imagem));
        fs.unlink(oldPath, () => {});
      }

      res.json({ deleted: this.changes });
    });
  });
};

exports.getAllCupons = (req, res) => {
  db.all('SELECT * FROM cupom ORDER BY id_cupom DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.createCupom = (req, res) => {
  const { codigo, desconto_tipo, desconto_valor } = req.body;
  if (!codigo || !desconto_valor) return res.status(400).json({ error: 'Código e valor são obrigatórios.' });

  db.run(
    'INSERT INTO cupom (codigo, desconto_tipo, desconto_valor) VALUES (?, ?, ?)',
    [codigo.trim().toUpperCase(), desconto_tipo || 'flat', Number(desconto_valor)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_cupom: this.lastID, codigo, desconto_tipo, desconto_valor });
    }
  );
};

exports.toggleCupom = (req, res) => {
  const { id } = req.params;
  db.get('SELECT ativo FROM cupom WHERE id_cupom = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Cupom não encontrado.' });
    db.run('UPDATE cupom SET ativo = ? WHERE id_cupom = ?', [row.ativo ? 0 : 1, id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ updated: this.changes });
    });
  });
};
