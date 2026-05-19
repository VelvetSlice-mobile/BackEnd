const db = require('../config/db');

exports.validateCupom = (req, res) => {
  const { codigo } = req.body;
  console.log('[Cupom] recebido:', JSON.stringify(codigo), '| body:', JSON.stringify(req.body));
  if (!codigo) return res.status(400).json({ error: 'Código do cupom é obrigatório.' });

  db.get('SELECT * FROM cupom WHERE codigo = ? AND ativo = 1', [codigo.trim().toUpperCase()], (err, row) => {
    console.log('[Cupom] resultado DB:', row ? row.codigo : 'não encontrado', '| err:', err?.message);
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Cupom inválido ou expirado.' });

    res.json({
      valido: true,
      codigo: row.codigo,
      tipo: row.desconto_tipo,
      valor: row.desconto_valor,
    });
  });
};
