const express = require("express");
const router = express.Router();
const boloController = require("../controllers/boloController");

router.get("/", boloController.getAllBolos);
router.post("/", boloController.createBolo);
router.post("/sync", boloController.syncProducts);
router.put("/:id", boloController.updateBolo);
router.delete("/:id", boloController.deleteBolo);

module.exports = router;