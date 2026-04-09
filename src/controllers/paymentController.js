const client = require('../config/mercadopago');
const { Preference } = require('mercadopago');
const db = require('../config/db');


exports.createPayment = async (req, res) => {
  try {
    const preference = new Preference(client);
    const { items, id_pedido } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "O carrinho está vazio." });
    }

    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.nome,
          quantity: Number(item.quantidade),
          unit_price: Number(item.preco_unitario),
          currency_id: 'BRL'
        })),

        back_urls: req.body.back_urls || {
          success: "myapp://payment-success",
          failure: "myapp://payment-failure",
          pending: "myapp://payment-pending"
        },
        auto_return: "approved",

        external_reference: id_pedido ? id_pedido.toString() : "0"
      }
    });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.receiveWebhook = async (req, res) => {
  try {
    const { query, body } = req;

    const paymentId = query.id || body.data && body.data.id;
    const type = query.type || body.type;


    if (type === 'payment' && paymentId) {

      const id_pedido = body.external_reference || query.external_reference;

      if (id_pedido) {
        const sql = `UPDATE pedido SET status_pedido = 'Pago' WHERE id_pedido = ?`;

        db.run(sql, [id_pedido]);
      }
    }

    res.status(200).send("OK");

  } catch (error) {
    res.status(200).send("Erro Processado");
  }
};