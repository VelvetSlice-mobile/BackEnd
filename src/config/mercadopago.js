const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config(); 

// autenticação com a API de pagamentos
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN});

module.exports = client;