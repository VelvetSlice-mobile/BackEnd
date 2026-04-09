const db = require("../config/db");


exports.createAddress = (req, res) => {
  const {
    nome_endereco,
    logradouro,
    numero,
    CEP,
    estado,
    complemento,
    fk_Cliente_id_cliente
  } = req.body;

  console.log("CRIAÇÃO DE ENDEREÇO RECEBIDA:", req.body);

  const sql = `INSERT INTO endereco (nome_endereco, logradouro, numero, CEP, estado, complemento) 
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(
    sql,
    [nome_endereco, logradouro, numero, CEP, estado, complemento],
    function (err) {
      if (err) {
        console.error("ERRO AO CRIAR ENDEREÇO:", err);
        return res.status(500).json({ error: err.message });
      }

      const newAddressId = this.lastID;
      const responsePayload = { id_endereco: newAddressId, ...req.body };

      if (fk_Cliente_id_cliente) {
        const linkSql = `INSERT OR IGNORE INTO endereco_entrega (fk_Cliente_id_cliente, fk_Endereco_id_endereco) VALUES (?, ?)`;
        db.run(linkSql, [fk_Cliente_id_cliente, newAddressId], function (linkErr) {
          if (linkErr) {
            console.error("ERRO AO VINCULAR ENDEREÇO AO CLIENTE:", linkErr);
            return res.status(500).json({ error: linkErr.message });
          }
          return res.status(201).json(responsePayload);
        });
      } else {
        return res.status(201).json(responsePayload);
      }
    }
  );
};


exports.linkAddressToClient = (req, res) => {
  const { fk_Cliente_id_cliente, fk_Endereco_id_endereco } = req.body;

  const sql = `INSERT OR IGNORE INTO endereco_entrega (fk_Cliente_id_cliente, fk_Endereco_id_endereco) VALUES (?, ?)`;

  db.run(sql, [fk_Cliente_id_cliente, fk_Endereco_id_endereco], function (err) {
    if (err) {
      console.error("ERRO AO VINCULAR ENDEREÇO:", err);
      return res.status(500).json({ error: err.message });
    }
    res.
    status(201).
    json({ message: "Endereço vinculado ao cliente com sucesso!" });
  });
};


exports.getAddressesByClient = (req, res) => {
  const sql = `
    SELECT DISTINCT e.* FROM endereco e
    JOIN endereco_entrega ee ON e.id_endereco = ee.fk_Endereco_id_endereco
    WHERE ee.fk_Cliente_id_cliente = ?`;

  console.log("BUSCANDO ENDEREÇOS PARA CLIENTE:", req.params.id_cliente);
  db.all(sql, [req.params.id_cliente], (err, rows) => {
    if (err) {
      console.error("ERRO SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    console.log("ROWS ENCONTRADOS:", rows);
    res.json(rows || []);
  });
};


exports.updateAddress = (req, res) => {
  const { nome_endereco, logradouro, numero, CEP, estado, complemento } =
  req.body;
  const sql = `UPDATE endereco 
               SET nome_endereco = ?, logradouro = ?, numero = ?, CEP = ?, estado = ?, complemento = ? 
               WHERE id_endereco = ?`;

  db.run(
    sql,
    [
    nome_endereco,
    logradouro,
    numero,
    CEP,
    estado,
    complemento,
    req.params.id],

    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
};


exports.deleteAddress = (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;

  const deleteLink = `
    DELETE FROM endereco_entrega
    WHERE fk_Cliente_id_cliente = ?
    AND fk_Endereco_id_endereco = ?
  `;

  db.run(deleteLink, [clientId, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });


    const cleanup = `
      DELETE FROM endereco
      WHERE id_endereco NOT IN (
        SELECT fk_Endereco_id_endereco FROM endereco_entrega
      )
      AND EXISTS (SELECT 1 FROM endereco_entrega)
    `;

    db.run(cleanup);

    res.json({ deleted: this.changes });
  });
};