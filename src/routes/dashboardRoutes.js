const express = require('express');
const multer = require('multer');
const router = express.Router();
const dc = require('../controllers/dashboardController');
const requireAdminAuth = require('../middleware/requireAdminAuth');
const { uploadProductImage } = require('../config/productImageUpload');

function handleProductImageUpload(req, res, next) {
    uploadProductImage.single("file")(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "Imagem muito grande. Limite de 5MB." });
        }
        return res.status(400).json({ error: err.message || "Falha no upload da imagem." });
    });
}

router.post('/register-admin', dc.registerAdmin);

router.get('/stats', requireAdminAuth, dc.getStats);
router.get('/mais-vendidos', requireAdminAuth, dc.getMaisVendidos);

router.get('/pedidos', requireAdminAuth, dc.getAllPedidos);
router.get('/pedidos/:id', requireAdminAuth, dc.getPedidoDetalhado);
router.put('/pedidos/:id/status', requireAdminAuth, dc.updatePedidoStatus);

router.get('/bolos', requireAdminAuth, dc.getAllBolos);
router.post('/bolos', requireAdminAuth, dc.createBolo);
router.put('/bolos/:id', requireAdminAuth, dc.updateBolo);
router.patch('/bolos/:id/toggle', requireAdminAuth, dc.toggleBoloAtivo);
router.post('/bolos/:id/image', requireAdminAuth, handleProductImageUpload, dc.uploadBoloImage);
router.delete('/bolos/:id', requireAdminAuth, dc.deleteBolo);

router.get('/cupons', requireAdminAuth, dc.getAllCupons);
router.post('/cupons', requireAdminAuth, dc.createCupom);
router.patch('/cupons/:id/toggle', requireAdminAuth, dc.toggleCupom);

module.exports = router;