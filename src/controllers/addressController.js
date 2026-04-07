const db = require("../config/db");

// 1. Criar novo endereço 
exports.createAddress = (req, res) => {
  const { nome_endereco, logradouro, numero, CEP, estado, complemento } = req.body;
  
  const sql = `INSERT INTO endereco (nome_endereco, logradouro, numero, CEP, estado, complemento) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [nome_endereco, logradouro, numero, CEP, estado, complemento], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    res.status(201).json({ id_endereco: this.lastID, ...req.body });
  });
};

// 2. Vincular Endereço ao Cliente 
exports.linkAddressToClient = (req, res) => {
  const { fk_Cliente_id_cliente, fk_Endereco_id_endereco } = req.body;
  
  const sql = `INSERT INTO endereco_entrega (fk_Cliente_id_cliente, fk_Endereco_id_endereco) VALUES (?, ?)`;
  
  db.run(sql, [fk_Cliente_id_cliente, fk_Endereco_id_endereco], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Endereço vinculado ao cliente com sucesso!" });
  });
};

// 3. Buscar endereços de um cliente 
exports.getAddressesByClient = (req, res) => {
  const sql = `
    SELECT e.* FROM endereco e
    JOIN endereco_entrega ee ON e.id_endereco = ee.fk_Endereco_id_endereco
    WHERE ee.fk_Cliente_id_cliente = ?`;
  
  db.all(sql, [req.params.id_cliente], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []); 
  });
};

// 4. Editar endereço 
exports.updateAddress = (req, res) => {
  const { nome_endereco, logradouro, numero, CEP, estado, complemento } = req.body;
  const sql = `UPDATE endereco 
               SET nome_endereco = ?, logradouro = ?, numero = ?, CEP = ?, estado = ?, complemento = ? 
               WHERE id_endereco = ?`;
  
  db.run(sql, [nome_endereco, logradouro, numero, CEP, estado, complemento, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
};

// 5. Remover endereço 
exports.deleteAddress = (req, res) => {
  db.run("DELETE FROM endereco WHERE id_endereco = ?", req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};