const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

router.get('/stats', async (req, res) => {
    try {
        const totalClientes = await db.query("SELECT COUNT(*) as total FROM clientes");
        const totalBolos = await db.query("SELECT COUNT(*) as total FROM bolos");
        const totalPedidos = await db.query("SELECT COUNT(*) as total FROM pedidos");

        res.json({
            clientes: totalClientes[0].total,
            bolos: totalBolos[0].total,
            pedidos: totalPedidos[0].total
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
});

module.exports = router;