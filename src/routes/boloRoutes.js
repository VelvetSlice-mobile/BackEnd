const express = require("express");
const router = express.Router();
const boloController = require("../controllers/boloController");
const avaliacaoController = require("../controllers/avaliacaoController");

router.get("/", boloController.getAllBolos);
router.post("/", boloController.createBolo);
router.post("/sync", boloController.syncProducts);
router.put("/:id", boloController.updateBolo);
router.delete("/:id", boloController.deleteBolo);

router.get("/:id/avaliacoes", avaliacaoController.getAvaliacoes);
router.post("/:id/avaliacoes", avaliacaoController.createAvaliacao);

module.exports = router;