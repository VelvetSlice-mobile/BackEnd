const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");

router.post("/", addressController.createAddress);
router.post("/link", addressController.linkAddressToClient); 
router.get("/client/:id_cliente", addressController.getAddressesByClient);
router.put("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;