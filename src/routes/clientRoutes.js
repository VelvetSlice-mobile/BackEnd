const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");


router.post("/register", clientController.registerClient);
router.get("/", clientController.getAllClients);
router.put("/:id", clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

module.exports = router;