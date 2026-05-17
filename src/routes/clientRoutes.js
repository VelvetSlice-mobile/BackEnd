const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");


router.post("/register", clientController.registerClient);
router.get("/", clientController.getAllClients);
<<<<<<< Updated upstream
=======
router.get("/:id", clientController.getClientById);
router.post("/:id/avatar", requireClientAuth, handleAvatarUpload, clientController.updateAvatar);
router.put("/:id/password", clientController.updatePassword);
>>>>>>> Stashed changes
router.put("/:id", clientController.updateClient);
router.delete("/:id", clientController.deleteClient);

module.exports = router;