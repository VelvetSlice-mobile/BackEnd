const client = require('../config/mercadopago');
const { Preference, Payment } = require('mercadopago');
const db = require('../config/db');

const PAYMENT_TYPE_LABELS = {
  account_money: 'Saldo MP',
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
};

function resolveMetodoPagamento(payment) {
  const typeId = payment.payment_type_id || null;
  return PAYMENT_TYPE_LABELS[typeId] || payment.payment_method_id || typeId || null;
}

exports.createPayment = async (req, res) => {
  try {
    const preference = new Preference(client);
    const { items, id_pedido } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "O carrinho está vazio." });
    }

    const preferenceBody = {
      items: items.map((item) => ({
        title: item.nome,
        quantity: Number(item.quantidade),
        unit_price: Number(item.preco_unitario),
        currency_id: 'BRL',
      })),
      back_urls: req.body.back_urls || {
        success: "myapp://payment-success",
        failure: "myapp://payment-failure",
        pending: "myapp://payment-pending",
      },
      auto_return: "approved",
      external_reference: id_pedido ? id_pedido.toString() : "0",
    };


    const result = await preference.create({ body: preferenceBody });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    const detail = error?.cause ?? error?.response ?? error?.message ?? String(error);
    console.error("[Payment] Erro ao criar preferência:", JSON.stringify(detail, null, 2));
    res.status(500).json({ error: error.message || "Erro interno ao criar pagamento." });
  }
};

exports.receiveWebhook = async (req, res) => {
  try {
    const { query, body } = req;
    const paymentId = query.id || body.data?.id;
    const type = query.type || body.type;

    if (type === 'payment' && paymentId) {
      const paymentApi = new Payment(client);
      const payment = await paymentApi.get({ id: paymentId });

      const id_pedido = payment.external_reference;
      const status = payment.status;

      if (id_pedido) {
        if (status === 'approved') {
          db.run(
            "UPDATE pedido SET status_pedido = 'Pago', metodo_pagamento = ? WHERE id_pedido = ?",
            [resolveMetodoPagamento(payment), id_pedido]
          );
        } else if (status === 'rejected' || status === 'cancelled') {
          db.run("UPDATE pedido SET status_pedido = 'Recusado' WHERE id_pedido = ?", [id_pedido]);
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(200).send("OK");
  }
};
