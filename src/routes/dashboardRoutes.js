const express = require('express');
const multer = require('multer');
const router = express.Router();
const dc = require('../controllers/dashboardController');
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

router.get('/stats', dc.getStats);
router.get('/mais-vendidos', dc.getMaisVendidos);

router.get('/pedidos', dc.getAllPedidos);
router.get('/pedidos/:id', dc.getPedidoDetalhado);
router.put('/pedidos/:id/status', dc.updatePedidoStatus);

router.get('/bolos', dc.getAllBolos);
router.post('/bolos', dc.createBolo);
router.put('/bolos/:id', dc.updateBolo);
router.post('/bolos/:id/image', handleProductImageUpload, dc.uploadBoloImage);
router.delete('/bolos/:id', dc.deleteBolo);

router.get('/cupons', dc.getAllCupons);
router.post('/cupons', dc.createCupom);
router.patch('/cupons/:id/toggle', dc.toggleCupom);

module.exports = router;
